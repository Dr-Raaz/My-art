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
  PaintBucket,
  Paintbrush,
  Eraser,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Save,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface ColoringStudioProps {
  artwork: Artwork;
  onBack: () => void;
}

export type ToolMode = 'bucket' | 'brush' | 'eraser';

export const ColoringStudio: React.FC<ColoringStudioProps> = ({ artwork, onBack }) => {
  // Tool state
  const [activeTool, setActiveTool] = useState<ToolMode>('bucket');
  const [selectedColor, setSelectedColor] = useState<string>('#EF4444');
  const [brushSize, setBrushSize] = useState<number>(14);

  // Canvas refs
  const containerRef = useRef<HTMLDivElement>(null);
  const paintCanvasRef = useRef<HTMLCanvasElement>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement>(null);

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
  const [zoomLevel, setZoomLevel] = useState(1);

  // Drawing state
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  // Sync undo/redo button states
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

      // 2. Compute the outline barrier mask (barriers for flood fill)
      barrierMaskRef.current = buildBarrierMask(
        { width, height, data: rawImageData.data },
        190, // Darkness threshold
        1    // Safety dilation
      );

      // 3. Setup Outline Canvas (Top Layer)
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

  // Coordinate mapping from client PointerEvent to canvas internal coordinate
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = paintCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    return {
      x: Math.max(0, Math.min(canvas.width - 1, x)),
      y: Math.max(0, Math.min(canvas.height - 1, y)),
    };
  };

  // Perform Flood Fill
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
      24 // Tolerance
    );

    if (fillResult.changed) {
      // Apply the filled image data
      ctx.putImageData(currentPaintData, 0, 0);
      pushHistorySnapshot();
    }
  };

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const { x, y } = getCanvasCoords(e);

    if (activeTool === 'bucket') {
      handleFloodFill(x, y);
      return;
    }

    // Brush or Eraser
    isDrawingRef.current = true;
    lastPointRef.current = { x, y };

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
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = selectedColor;
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    e.preventDefault();

    const { x, y } = getCanvasCoords(e);
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
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.restore();

    lastPointRef.current = { x, y };
  };

  // Pointer Up / Leave
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPointRef.current = null;
    pushHistorySnapshot();
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

    // Export canvas
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

    // Trigger download
    const link = document.createElement('a');
    link.download = `${artwork.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_colored.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Studio Top Navigation Bar */}
      <header className="bg-white border-b border-purple-100 shadow-xs px-4 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Back & Artwork Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer flex items-center gap-1.5 font-bold text-sm"
              aria-label="Back to Gallery"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Gallery</span>
            </button>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-800 font-['Fredoka'] truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                {artwork.title}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {artwork.difficulty}
                </span>
                {isSavedLocally && (
                  <span className="text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Saved locally</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions (Reset, Download) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="Reset Coloring"
              aria-label="Reset colors"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden md:inline">Reset</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold text-sm shadow-md shadow-purple-200 hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
              aria-label="Download Finished Artwork"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 flex flex-col lg:flex-row gap-4 sm:gap-6 items-start justify-center">
        {/* Left / Top Toolbar (Tools, Undo/Redo, Brush Size) */}
        <div className="w-full lg:w-44 bg-white rounded-3xl border border-purple-100 p-3.5 shadow-sm flex lg:flex-col gap-3 justify-between items-center shrink-0 lg:sticky lg:top-20 z-20">
          {/* Tool Selectors */}
          <div className="flex lg:flex-col gap-2 w-full">
            <button
              onClick={() => setActiveTool('bucket')}
              className={`flex-1 lg:w-full p-3 rounded-2xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 transition-all cursor-pointer ${
                activeTool === 'bucket'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
              }`}
              aria-label="Magic Paint Bucket Fill Tool"
              aria-pressed={activeTool === 'bucket'}
            >
              <PaintBucket className="w-5 h-5 shrink-0" />
              <span>Fill</span>
            </button>

            <button
              onClick={() => setActiveTool('brush')}
              className={`flex-1 lg:w-full p-3 rounded-2xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 transition-all cursor-pointer ${
                activeTool === 'brush'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
              }`}
              aria-label="Freehand Brush Tool"
              aria-pressed={activeTool === 'brush'}
            >
              <Paintbrush className="w-5 h-5 shrink-0" />
              <span>Brush</span>
            </button>

            <button
              onClick={() => setActiveTool('eraser')}
              className={`flex-1 lg:w-full p-3 rounded-2xl font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 transition-all cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                  : 'bg-purple-50 text-slate-700 hover:bg-purple-100'
              }`}
              aria-label="Eraser Tool"
              aria-pressed={activeTool === 'eraser'}
            >
              <Eraser className="w-5 h-5 shrink-0" />
              <span>Eraser</span>
            </button>
          </div>

          {/* Brush/Eraser Size Slider (Visible when brush or eraser selected) */}
          {(activeTool === 'brush' || activeTool === 'eraser') && (
            <div className="hidden lg:flex flex-col gap-1.5 w-full bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                <span>Size</span>
                <span>{brushSize}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="48"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
                aria-label="Brush size slider"
              />
              <div className="flex items-center justify-center pt-1">
                <div
                  className="rounded-full bg-slate-800 transition-all"
                  style={{
                    width: `${Math.min(28, brushSize)}px`,
                    height: `${Math.min(28, brushSize)}px`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Undo / Redo */}
          <div className="flex lg:w-full gap-2 justify-center">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-3 rounded-2xl flex-1 flex items-center justify-center transition-all ${
                canUndo
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 cursor-pointer shadow-xs'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title="Undo last action"
              aria-label="Undo"
            >
              <Undo2 className="w-5 h-5" />
            </button>

            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-3 rounded-2xl flex-1 flex items-center justify-center transition-all ${
                canRedo
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 cursor-pointer shadow-xs'
                  : 'bg-slate-100 text-slate-300 cursor-not-allowed'
              }`}
              title="Redo action"
              aria-label="Redo"
            >
              <Redo2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: Layered Canvas Display */}
        <div className="flex-1 w-full flex flex-col items-center">
          {/* Mobile brush size bar */}
          {(activeTool === 'brush' || activeTool === 'eraser') && (
            <div className="lg:hidden w-full max-w-md bg-white p-2.5 rounded-2xl border border-purple-100 mb-3 flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                Size: {brushSize}px
              </span>
              <input
                type="range"
                min="4"
                max="48"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-purple-600"
                aria-label="Mobile brush size slider"
              />
            </div>
          )}

          {/* Canvas Viewport Container */}
          <div
            ref={containerRef}
            className="relative w-full max-w-[540px] sm:max-w-[560px] aspect-square bg-white rounded-3xl border-4 border-purple-100 shadow-xl overflow-hidden flex items-center justify-center select-none"
            style={{ touchAction: 'none' }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center z-50">
                <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin mb-3" />
                <p className="font-bold text-slate-700 text-sm">Preparing coloring page...</p>
              </div>
            )}

            {/* Layer 1: Colored Paint Layer (Bottom) */}
            <canvas
              ref={paintCanvasRef}
              className="absolute inset-0 w-full h-full object-contain canvas-drawing cursor-crosshair z-10"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onPointerCancel={handlePointerUp}
              data-testid="paint-canvas"
            />

            {/* Layer 2: Original Illustration Outlines (Top Overlay) */}
            <canvas
              ref={outlineCanvasRef}
              className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20"
              data-testid="outline-canvas"
            />
          </div>

          {/* Friendly Tooltip under canvas */}
          <div className="mt-2.5 text-center text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {activeTool === 'bucket' && 'Tap any section inside the picture to fill it with color!'}
            {activeTool === 'brush' && 'Click and drag or touch to paint freely!'}
            {activeTool === 'eraser' && 'Click and drag to erase your coloring without removing the black lines!'}
          </div>

          {/* 36-Color Palette Component */}
          <div className="w-full max-w-[560px] mt-3">
            <ColorPalette
              selectedColor={selectedColor}
              onSelectColor={(hex) => {
                setSelectedColor(hex);
                // If user was in eraser mode, switch back to brush or bucket
                if (activeTool === 'eraser') {
                  setActiveTool('bucket');
                }
              }}
            />
          </div>
        </div>
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
            <p className="text-sm text-slate-500 mb-6 font-medium">
              This will clear only your colors on this picture. The black outlines will remain safe!
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
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
