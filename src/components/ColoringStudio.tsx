/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Artwork } from '../data/defaultArtworks';
import { ColorPalette } from './ColorPalette';
import {
  hexToRgba,
  buildBarrierMask,
  createOutlineOverlay,
  performFloodFill,
} from '../utils/floodFill';
import { HistoryManager } from '../utils/history';
import {
  saveColoringProgress,
  loadColoringProgress,
  clearColoringProgress,
} from '../utils/indexedDB';
import {
  screenToArtworkCoords,
  calculateFitDimensions,
  clampPanOffset,
} from '../utils/coordinateTransform';
import {
  PaintBucket,
  Paintbrush,
  Eraser,
  Hand,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface ColoringStudioProps {
  artwork: Artwork;
  onBack: () => void;
}

export type ToolMode = 'bucket' | 'brush' | 'eraser' | 'pan';

export const ColoringStudio: React.FC<ColoringStudioProps> = ({ artwork, onBack }) => {
  // Tool state
  const [activeTool, setActiveTool] = useState<ToolMode>('bucket');
  const [selectedColor, setSelectedColor] = useState<string>('#EF4444');
  const [brushSize, setBrushSize] = useState<number>(14);

  // Zoom & Pan state
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Viewport & Canvas container refs
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null);

  // Artwork dimensions in screen pixels at 1x
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number }>({
    width: 600,
    height: 600,
  });

  // Raw image buffers
  const originalBufferRef = useRef<{ width: number; height: number; data: Uint8ClampedArray } | null>(null);
  const barrierMaskRef = useRef<Uint8Array | null>(null);

  // History Manager
  const historyRef = useRef<HistoryManager<ImageData>>(new HistoryManager<ImageData>(20));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Loading & Save states
  const [isLoading, setIsLoading] = useState(true);
  const [isSavedLocally, setIsSavedLocally] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Interaction refs
  const isInteractingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; startPanX: number; startPanY: number }>({
    clientX: 0,
    clientY: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const lastArtworkPointRef = useRef<{ x: number; y: number } | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Touch pinch-to-zoom tracking
  const touchDistanceRef = useRef<number | null>(null);

  // Sync history state
  const updateHistoryState = useCallback(() => {
    setCanUndo(historyRef.current.canUndo());
    setCanRedo(historyRef.current.canRedo());
  }, []);

  // Save progress to IndexedDB with debounce
  const triggerAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(async () => {
      const paintCanvas = paintCanvasRef.current;
      if (!paintCanvas) return;
      try {
        const dataUrl = paintCanvas.toDataURL('image/png');
        await saveColoringProgress(artwork.id, dataUrl);
        setIsSavedLocally(true);
      } catch (err) {
        console.warn('Failed to auto-save to IndexedDB:', err);
      }
    }, 600);
  }, [artwork.id]);

  // Capture canvas state for undo/redo
  const pushHistorySnapshot = useCallback(() => {
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    const snapshot = ctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
    historyRef.current.push(snapshot);
    updateHistoryState();
    triggerAutoSave();
  }, [updateHistoryState, triggerAutoSave]);

  // Recalculate fit display dimensions whenever viewport resizes
  const updateLayoutDimensions = useCallback(() => {
    if (!viewportRef.current) return;
    const { clientWidth, clientHeight } = viewportRef.current;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    const artW = artwork.imageWidth || 800;
    const artH = artwork.imageHeight || 800;

    // Use responsive padding (tighter on mobile, generous on desktop)
    const padding = window.innerWidth < 640 ? 12 : 24;
    const fit = calculateFitDimensions(clientWidth, clientHeight, artW, artH, padding);
    setDisplaySize(fit);
  }, [artwork.imageWidth, artwork.imageHeight]);

  useEffect(() => {
    updateLayoutDimensions();
    const handleResize = () => updateLayoutDimensions();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateLayoutDimensions]);

  // Initialize and load illustration
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      if (!isMounted) return;

      const width = img.naturalWidth || artwork.imageWidth || 800;
      const height = img.naturalHeight || artwork.imageHeight || 800;

      // 1. Setup offscreen canvas to extract raw pixel buffer
      const offscreen = document.createElement('canvas');
      offscreen.width = width;
      offscreen.height = height;
      const offCtx = offscreen.getContext('2d', { willReadFrequently: true });
      if (!offCtx) return;

      offCtx.fillStyle = '#ffffff';
      offCtx.fillRect(0, 0, width, height);
      offCtx.drawImage(img, 0, 0, width, height);

      const rawImageData = offCtx.getImageData(0, 0, width, height);
      originalBufferRef.current = {
        width,
        height,
        data: rawImageData.data,
      };

      // 2. Build barrier mask (tight core barrier to prevent leaks while allowing gap-free underbleed)
      barrierMaskRef.current = buildBarrierMask(
        { width, height, data: rawImageData.data },
        175,
        0
      );

      // 3. Setup Outline Canvas (Top Layer with transparent background)
      const outlineCanvas = outlineCanvasRef.current;
      if (outlineCanvas) {
        outlineCanvas.width = width;
        outlineCanvas.height = height;
        const outCtx = outlineCanvas.getContext('2d');
        if (outCtx) {
          outCtx.clearRect(0, 0, width, height);
          const outlineOverlay = createOutlineOverlay(
            { width, height, data: rawImageData.data },
            245
          );
          outCtx.putImageData(outlineOverlay, 0, 0);
        }
      }

      // 4. Setup Paint Canvas (Bottom Layer)
      const paintCanvas = paintCanvasRef.current;
      if (paintCanvas) {
        paintCanvas.width = width;
        paintCanvas.height = height;
        const paintCtx = paintCanvas.getContext('2d', { willReadFrequently: true });
        if (paintCtx) {
          paintCtx.clearRect(0, 0, width, height);

          // Check if there is saved progress in IndexedDB
          const savedProgress = await loadColoringProgress(artwork.id);
          if (savedProgress && savedProgress.paintDataUrl) {
            const restoredImg = new Image();
            restoredImg.onload = () => {
              if (!isMounted) return;
              paintCtx.drawImage(restoredImg, 0, 0);
              pushHistorySnapshot();
              setIsSavedLocally(true);
              setIsLoading(false);
            };
            restoredImg.src = savedProgress.paintDataUrl;
            return;
          }

          // Initial snapshot
          pushHistorySnapshot();
          setIsLoading(false);
        }
      }
    };

    img.onerror = () => {
      console.error('Failed to load artwork image:', artwork.imageUrl);
      setIsLoading(false);
    };

    img.src = artwork.imageUrl;

    return () => {
      isMounted = false;
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [artwork.id, artwork.imageUrl, artwork.imageWidth, artwork.imageHeight, pushHistorySnapshot]);

  // Precise coordinate mapping from pointer screen position to artwork space
  const getTransformedArtworkCoords = (clientX: number, clientY: number) => {
    const wrapper = canvasWrapperRef.current;
    const orig = originalBufferRef.current;
    if (!wrapper || !orig) return null;

    const rect = wrapper.getBoundingClientRect();
    return screenToArtworkCoords(clientX, clientY, rect, orig.width, orig.height);
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(4, Math.round((prev + 0.5) * 10) / 10));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(1, Math.round((prev - 0.5) * 10) / 10);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Perform Flood Fill (with under-bleed edge coverage to eliminate white gaps)
  const handleFloodFill = (targetX: number, targetY: number) => {
    const paintCanvas = paintCanvasRef.current;
    const barrierMask = barrierMaskRef.current;
    if (!paintCanvas || !barrierMask) return;

    const ctx = paintCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const { width, height } = paintCanvas;
    const currentPaintData = ctx.getImageData(0, 0, width, height);
    const fillColor = hexToRgba(selectedColor, 255);

    const fillResult = performFloodFill(
      { width, height, data: currentPaintData.data },
      barrierMask,
      targetX,
      targetY,
      fillColor,
      24,
      2 // 2px under-bleed eliminates white halos completely
    );

    if (fillResult.changed) {
      ctx.putImageData(currentPaintData, 0, 0);
      pushHistorySnapshot();
    }
  };

  // Pointer Down (Mouse, Touch, Stylus)
  const handlePointerDown = (e: React.PointerEvent) => {
    // Check if middle click or Space key held for panning
    const isMiddleClick = e.button === 1;
    const isPanMode = activeTool === 'pan' || isMiddleClick;

    if (isPanMode) {
      isPanningRef.current = true;
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      return;
    }

    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const coords = getTransformedArtworkCoords(e.clientX, e.clientY);
    if (!coords) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    if (activeTool === 'bucket') {
      handleFloodFill(coords.x, coords.y);
      return;
    }

    // Brush or Eraser
    isInteractingRef.current = true;
    lastArtworkPointRef.current = coords;

    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = selectedColor;
    }

    ctx.beginPath();
    ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    // Panning
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;

      if (viewportRef.current) {
        const { clientWidth, clientHeight } = viewportRef.current;
        const clamped = clampPanOffset(
          panStartRef.current.startPanX + dx,
          panStartRef.current.startPanY + dy,
          zoomLevel,
          displaySize.width,
          displaySize.height,
          clientWidth,
          clientHeight
        );
        setPanOffset(clamped);
      }
      return;
    }

    // Drawing / Erasing
    if (!isInteractingRef.current || !lastArtworkPointRef.current) return;

    const coords = getTransformedArtworkCoords(e.clientX, e.clientY);
    if (!coords) return;

    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (activeTool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = selectedColor;
    }

    ctx.beginPath();
    ctx.moveTo(lastArtworkPointRef.current.x, lastArtworkPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
    ctx.restore();

    lastArtworkPointRef.current = coords;
  };

  // Pointer Up / Cancel
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    if (isInteractingRef.current) {
      isInteractingRef.current = false;
      lastArtworkPointRef.current = null;
      pushHistorySnapshot();
    }
  };

  // Wheel zoom / pan
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey || activeTool === 'pan') {
      // Zoom
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setZoomLevel((prev) => {
        const next = Math.max(1, Math.min(4, Math.round((prev + delta) * 100) / 100));
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    } else {
      // Pan
      if (zoomLevel > 1 && viewportRef.current) {
        const { clientWidth, clientHeight } = viewportRef.current;
        setPanOffset((prev) =>
          clampPanOffset(
            prev.x - e.deltaX,
            prev.y - e.deltaY,
            zoomLevel,
            displaySize.width,
            displaySize.height,
            clientWidth,
            clientHeight
          )
        );
      }
    }
  };

  // Undo Action
  const handleUndo = () => {
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    const currentSnapshot = ctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
    const previousSnapshot = historyRef.current.undo(currentSnapshot);

    if (previousSnapshot) {
      ctx.putImageData(previousSnapshot, 0, 0);
      updateHistoryState();
      triggerAutoSave();
    }
  };

  // Redo Action
  const handleRedo = () => {
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    const currentSnapshot = ctx.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
    const nextSnapshot = historyRef.current.redo(currentSnapshot);

    if (nextSnapshot) {
      ctx.putImageData(nextSnapshot, 0, 0);
      updateHistoryState();
      triggerAutoSave();
    }
  };

  // Reset Artwork Paint
  const handleReset = async () => {
    const paintCanvas = paintCanvasRef.current;
    if (!paintCanvas) return;
    const ctx = paintCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    historyRef.current.clear();
    pushHistorySnapshot();
    await clearColoringProgress(artwork.id);
    setIsSavedLocally(false);
    setShowResetConfirm(false);
  };

  // Download Composite PNG
  const handleDownload = () => {
    const paintCanvas = paintCanvasRef.current;
    const originalBuffer = originalBufferRef.current;
    if (!paintCanvas || !originalBuffer) return;

    const { width, height } = paintCanvas;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = width;
    exportCanvas.height = height;
    const exportCtx = exportCanvas.getContext('2d');
    if (!exportCtx) return;

    // 1. Pure white background
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, width, height);

    // 2. Colored paint layer underneath
    exportCtx.drawImage(paintCanvas, 0, 0);

    // 3. Crisp original outline layer on top
    const outlineCanvas = outlineCanvasRef.current;
    if (outlineCanvas) {
      exportCtx.drawImage(outlineCanvas, 0, 0);
    }

    const link = document.createElement('a');
    link.download = `${artwork.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_colored.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-slate-50 overflow-hidden select-none">
      {/* Studio Top Navigation Bar (Compact & Responsive) */}
      <header className="h-14 sm:h-16 bg-white border-b border-purple-100 shadow-xs px-3 sm:px-6 flex items-center justify-between gap-2 shrink-0 z-30">
        {/* Back Button & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={onBack}
            className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-xs sm:text-sm shrink-0"
            aria-label="Back to Gallery"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Gallery</span>
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 font-['Fredoka'] truncate max-w-[140px] sm:max-w-xs md:max-w-md">
              {artwork.title}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded-full uppercase">
                {artwork.difficulty}
              </span>
              {isSavedLocally && (
                <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="hidden md:inline">Saved locally</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center / Action Controls: Zoom HUD & Undo/Redo (Visible in header on small screens) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Zoom Controls HUD */}
          <div className="flex items-center bg-slate-100/90 rounded-2xl p-1 gap-1 text-slate-700">
            <button
              onClick={handleZoomOut}
              disabled={zoomLevel <= 1}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 rounded-xl text-xs font-bold hover:bg-white text-slate-700 cursor-pointer transition-colors"
              title="Reset Zoom to 100%"
              aria-label="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoomLevel >= 4}
              className="p-1.5 rounded-xl hover:bg-white text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Undo / Redo in header for instant access on all screen sizes */}
          <div className="flex items-center bg-slate-100/90 rounded-2xl p-1 gap-0.5">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-1.5 rounded-xl hover:bg-white text-purple-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title="Undo last stroke"
              aria-label="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-1.5 rounded-xl hover:bg-white text-purple-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-colors"
              title="Redo stroke"
              aria-label="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Reset Action */}
          <button
            onClick={() => setShowResetConfirm(true)}
            className="p-2 rounded-2xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
            title="Reset colors"
            aria-label="Reset colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Download Action */}
          <button
            onClick={handleDownload}
            className="px-3 sm:px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-200 transition-all cursor-pointer flex items-center gap-1.5"
            aria-label="Download Finished Artwork"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: Workspace with Sidebar Toolbar & Centered Canvas Viewport */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative overflow-hidden">
        {/* Left Toolbar on Desktop & Tablet / Top Floating Bar on Mobile */}
        <aside className="w-full md:w-20 lg:w-44 bg-white/95 backdrop-blur-md border-b md:border-b-0 md:border-r border-purple-100 p-2 sm:p-3 flex md:flex-col justify-between items-center gap-2 shrink-0 z-20 overflow-x-auto no-scrollbar">
          {/* Tool Buttons */}
          <div className="flex md:flex-col gap-2 w-full justify-center md:justify-start">
            <button
              onClick={() => setActiveTool('bucket')}
              className={`p-2.5 lg:px-4 lg:py-3 rounded-2xl font-bold text-xs flex items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer shrink-0 ${
                activeTool === 'bucket'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
              }`}
              title="Magic Fill Tool: tap enclosed area to color"
              aria-label="Magic Paint Bucket Fill Tool"
              aria-pressed={activeTool === 'bucket'}
            >
              <PaintBucket className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline">Fill</span>
            </button>

            <button
              onClick={() => setActiveTool('brush')}
              className={`p-2.5 lg:px-4 lg:py-3 rounded-2xl font-bold text-xs flex items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer shrink-0 ${
                activeTool === 'brush'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
              }`}
              title="Freehand Brush Tool"
              aria-label="Freehand Brush Tool"
              aria-pressed={activeTool === 'brush'}
            >
              <Paintbrush className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline">Brush</span>
            </button>

            <button
              onClick={() => setActiveTool('eraser')}
              className={`p-2.5 lg:px-4 lg:py-3 rounded-2xl font-bold text-xs flex items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer shrink-0 ${
                activeTool === 'eraser'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
              }`}
              title="Eraser Tool: erases coloring without erasing black lines"
              aria-label="Eraser Tool"
              aria-pressed={activeTool === 'eraser'}
            >
              <Eraser className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline">Eraser</span>
            </button>

            <button
              onClick={() => setActiveTool(activeTool === 'pan' ? 'bucket' : 'pan')}
              className={`p-2.5 lg:px-4 lg:py-3 rounded-2xl font-bold text-xs flex items-center justify-center lg:justify-start gap-2.5 transition-all cursor-pointer shrink-0 ${
                activeTool === 'pan'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
              }`}
              title="Hand Tool: Drag to pan around zoomed picture"
              aria-label="Pan Tool"
              aria-pressed={activeTool === 'pan'}
            >
              <Hand className="w-5 h-5 shrink-0" />
              <span className="hidden lg:inline">Move</span>
            </button>
          </div>

          {/* Brush/Eraser Size Slider */}
          {(activeTool === 'brush' || activeTool === 'eraser') && (
            <div className="flex md:flex-col items-center gap-2 bg-slate-50 p-2 sm:p-2.5 rounded-2xl border border-slate-100 w-auto md:w-full shrink-0">
              <div className="flex items-center justify-between w-full text-[11px] font-bold text-slate-600">
                <span className="hidden lg:inline">Size:</span>
                <span>{brushSize}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="48"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-20 md:w-full accent-purple-600 cursor-pointer"
                aria-label="Brush size slider"
              />
            </div>
          )}

          {/* Active Tool Hint (Desktop only) */}
          <div className="hidden lg:block text-center text-[10px] text-slate-400 font-medium px-2 py-1 leading-tight">
            {activeTool === 'bucket' && 'Tap regions to fill without leakage'}
            {activeTool === 'brush' && 'Freehand drawing'}
            {activeTool === 'eraser' && 'Erase paint'}
            {activeTool === 'pan' && 'Drag to move view'}
          </div>
        </aside>

        {/* Center: Canvas Viewport (Supports Zoom & Pan & Fullscreen Touch) */}
        <main
          ref={viewportRef}
          onWheel={handleWheel}
          className="flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-4 cursor-default min-h-0"
          style={{ touchAction: 'none' }}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center z-50">
              <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mb-3" />
              <p className="font-bold text-slate-700 text-sm font-['Fredoka']">Preparing coloring page...</p>
            </div>
          )}

          {/* Canvas Wrapper Element: Exactly sized to aspect ratio with CSS transform for smooth zoom and pan */}
          <div
            ref={canvasWrapperRef}
            className={`relative bg-white rounded-3xl shadow-2xl border-4 border-purple-100 select-none transition-shadow ${
              activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-crosshair'
            }`}
            style={{
              width: `${displaySize.width}px`,
              height: `${displaySize.height}px`,
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center',
              willChange: 'transform',
              touchAction: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Layer 1: Colored Paint Canvas (Bottom Layer) */}
            <canvas
              ref={paintCanvasRef}
              className="absolute inset-0 w-full h-full block rounded-[22px] canvas-drawing"
              data-testid="paint-canvas"
            />

            {/* Layer 2: Original Illustration Outlines Canvas (Top Layer with transparency) */}
            <canvas
              ref={outlineCanvasRef}
              className="absolute inset-0 w-full h-full block rounded-[22px] pointer-events-none z-10"
              data-testid="outline-canvas"
            />
          </div>

          {/* Zoom notification badge if zoomed in */}
          {zoomLevel > 1 && (
            <div className="absolute top-3 right-3 bg-purple-900/80 text-white backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-md pointer-events-none z-20 flex items-center gap-1.5">
              <span>Zoomed {Math.round(zoomLevel * 100)}%</span>
              <span className="text-purple-300">• Move tool to pan</span>
            </div>
          )}

          {/* Desktop Palette Placement: Docked at bottom of viewport area */}
          <div className="hidden md:block absolute bottom-3 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20">
            <ColorPalette
              selectedColor={selectedColor}
              onSelectColor={(hex) => {
                setSelectedColor(hex);
                if (activeTool === 'eraser' || activeTool === 'pan') {
                  setActiveTool('bucket');
                }
              }}
              isMobileFixed={false}
            />
          </div>
        </main>
      </div>

      {/* Mobile Fixed Color Palette Dock (Always fixed at bottom above safe area, never moves with zoom/pan) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
        <ColorPalette
          selectedColor={selectedColor}
          onSelectColor={(hex) => {
            setSelectedColor(hex);
            if (activeTool === 'eraser' || activeTool === 'pan') {
              setActiveTool('bucket');
            }
          }}
          isMobileFixed={true}
        />
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-purple-100 text-center animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 font-['Fredoka'] mb-2">
              Start Over?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 font-medium">
              This will clear only your colors on this picture. The original black outlines will remain safe!
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
              >
                Yes, Clear Colors
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
