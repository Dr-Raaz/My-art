/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PixelBuffer {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface FillBounds {
  changed: boolean;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Converts a hex color (#RRGGBB or #RGB) to RGBA tuple [r, g, b, a].
 */
export function hexToRgba(hex: string, alpha = 255): [number, number, number, number] {
  let cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) {
    return [0, 0, 0, alpha];
  }
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r, g, b, alpha];
}

/**
 * Converts RGBA numbers to Hex string.
 */
export function rgbaToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Calculates perceived luminance of an RGB pixel.
 * Scale: 0 (black) to 255 (white).
 */
export function getLuminance(r: number, g: number, b: number, a: number): number {
  if (a < 20) return 255; // transparent is treated as non-barrier
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Builds a 1-byte-per-pixel barrier mask from the original black-and-white illustration.
 * 1 = Barrier (black outline or dark edge, impassable).
 * 0 = Free region (enclosed area or white background, fillable).
 *
 * @param original - The pixel buffer of the raw original illustration.
 * @param darknessThreshold - Luminance below which a pixel is considered an outline barrier (default 175).
 * @param safetyDilate - Expand core barrier to bridge 1-pixel micro-gaps in anti-aliasing.
 */
export function buildBarrierMask(
  original: PixelBuffer,
  darknessThreshold = 175,
  safetyDilate = 0
): Uint8Array {
  const { width, height, data } = original;
  const totalPixels = width * height;
  const rawMask = new Uint8Array(totalPixels);

  // Step 1: Detect dark outlines and anti-aliased edges
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    // If pixel is sufficiently dark and visible, it's an outline barrier
    if (a > 30 && getLuminance(r, g, b, a) < darknessThreshold) {
      rawMask[i] = 1;
    }
  }

  // Step 2: Optional micro-bridge for antialiasing pinholes
  if (safetyDilate <= 0) {
    return rawMask;
  }

  const dilatedMask = new Uint8Array(rawMask);
  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x;
      if (rawMask[idx] === 1) {
        const neighbors = [idx - 1, idx + 1, idx - width, idx + width];
        for (const neighborIdx of neighbors) {
          if (rawMask[neighborIdx] === 0) {
            const pIdx = neighborIdx * 4;
            const lum = getLuminance(data[pIdx], data[pIdx + 1], data[pIdx + 2], data[pIdx + 3]);
            if (lum < 200) {
              dilatedMask[neighborIdx] = 1;
            }
          }
        }
      }
    }
  }

  return dilatedMask;
}

/**
 * Pre-processes the original illustration into an outline overlay.
 * Converts white pixels (or near-white background) to transparent,
 * preserving dark outlines and anti-aliased edge smoothing.
 */
export function createOutlineOverlay(original: PixelBuffer, threshold = 245): ImageData {
  const { width, height, data } = original;
  const overlayData = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    if (a < 10) {
      overlayData[i + 3] = 0;
      continue;
    }

    const lum = getLuminance(r, g, b, a);
    if (lum >= threshold) {
      // Completely white background -> fully transparent
      overlayData[i] = 0;
      overlayData[i + 1] = 0;
      overlayData[i + 2] = 0;
      overlayData[i + 3] = 0;
    } else {
      // Dark outlines: keep original dark color and modulate alpha smoothly
      // Using a contrast-adjusted curve so lines are deep and edges taper cleanly
      const darkness = 1 - (lum / threshold);
      const lineAlpha = Math.min(255, Math.max(0, Math.round(Math.pow(darkness, 0.65) * 255)));
      overlayData[i] = r;
      overlayData[i + 1] = g;
      overlayData[i + 2] = b;
      overlayData[i + 3] = lineAlpha;
    }
  }

  if (typeof ImageData !== 'undefined') {
    return new ImageData(overlayData, width, height);
  }
  return { width, height, data: overlayData } as unknown as ImageData;
}

/**
 * Checks if two colors in the paint buffer match within tolerance.
 */
function colorMatch(
  data: Uint8ClampedArray,
  idx: number,
  r: number,
  g: number,
  b: number,
  a: number,
  tolerance = 16
): boolean {
  return (
    Math.abs(data[idx] - r) <= tolerance &&
    Math.abs(data[idx + 1] - g) <= tolerance &&
    Math.abs(data[idx + 2] - b) <= tolerance &&
    Math.abs(data[idx + 3] - a) <= tolerance
  );
}

/**
 * High-performance, gap-free Flood Fill algorithm.
 * Operates on the paint layer, guarded by the barrier mask so that colors
 * never spill into adjacent regions.
 *
 * To completely eliminate white gaps/halos between the filled region and the dark outlines:
 * Once the region is filled, it performs an edge-aware color expansion (under-bleed) of
 * up to bleedPixels strictly into outline barrier pixels. Because the outline overlay is
 * rendered on top with smooth anti-aliased alpha, the paint layer cleanly tucks underneath
 * the black outline, producing smooth, gap-free coloring.
 *
 * @param paintBuffer - The paint layer's ImageData to modify.
 * @param barrierMask - Pre-computed barrier mask (1 = outline barrier, 0 = fillable).
 * @param startX - Tapped X coordinate.
 * @param startY - Tapped Y coordinate.
 * @param fillColor - RGBA color tuple to fill with.
 * @param tolerance - Color comparison tolerance on the paint layer.
 * @param bleedPixels - Pixels to tuck under outline barrier to eliminate white halos (default 2).
 */
export function performFloodFill(
  paintBuffer: PixelBuffer,
  barrierMask: Uint8Array,
  startX: number,
  startY: number,
  fillColor: [number, number, number, number],
  tolerance = 24,
  bleedPixels = 2
): FillBounds {
  const { width, height, data } = paintBuffer;

  const noChange: FillBounds = { changed: false, minX: 0, minY: 0, maxX: 0, maxY: 0 };

  // Out of bounds check
  if (startX < 0 || startX >= width || startY < 0 || startY >= height) {
    return noChange;
  }

  let startIdx = startY * width + startX;

  // If clicked directly on a barrier pixel, check immediate 3x3 neighbors for an adjacent fillable spot
  if (barrierMask[startIdx] === 1) {
    let found = false;
    for (let dy = -2; dy <= 2 && !found; dy++) {
      for (let dx = -2; dx <= 2 && !found; dx++) {
        const nx = startX + dx;
        const ny = startY + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nIdx = ny * width + nx;
          if (barrierMask[nIdx] === 0) {
            startX = nx;
            startY = ny;
            startIdx = nIdx;
            found = true;
          }
        }
      }
    }
    if (!found) {
      return noChange; // Clicked on thick barrier, cannot fill
    }
  }

  const startPixelIdx = startIdx * 4;
  const [fillR, fillG, fillB, fillA] = fillColor;
  const origR = data[startPixelIdx];
  const origG = data[startPixelIdx + 1];
  const origB = data[startPixelIdx + 2];
  const origA = data[startPixelIdx + 3];

  // Already the exact same color?
  if (
    Math.abs(origR - fillR) <= 3 &&
    Math.abs(origG - fillG) <= 3 &&
    Math.abs(origB - fillB) <= 3 &&
    Math.abs(origA - fillA) <= 3
  ) {
    return noChange;
  }

  // Visited bitmask to prevent re-visiting pixels
  const visited = new Uint8Array(width * height);

  // Coordinate queue (x, y stored as flat integer (y * width + x))
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  queue[tail++] = startIdx;
  visited[startIdx] = 1;

  let minX = startX;
  let maxX = startX;
  let minY = startY;
  let maxY = startY;
  let filledCount = 0;

  // Track boundary pixels that touch the outline barrier for edge-bleed
  const boundaryPixels: number[] = [];

  while (head < tail) {
    const curIdx = queue[head++];
    const cx = curIdx % width;
    const cy = Math.floor(curIdx / width);

    // Track bounding box
    if (cx < minX) minX = cx;
    if (cx > maxX) maxX = cx;
    if (cy < minY) minY = cy;
    if (cy > maxY) maxY = cy;

    // Apply color to paint data
    const pIdx = curIdx * 4;
    data[pIdx] = fillR;
    data[pIdx + 1] = fillG;
    data[pIdx + 2] = fillB;
    data[pIdx + 3] = fillA;
    filledCount++;

    let touchesBarrier = false;

    // Check 4-directional neighbors
    const neighbors = [
      curIdx - width, // North
      curIdx + width, // South
      curIdx - 1,     // West
      curIdx + 1,     // East
    ];

    const cxCoords = [cx, cx, cx - 1, cx + 1];
    const cyCoords = [cy - 1, cy + 1, cy, cy];

    for (let i = 0; i < 4; i++) {
      const nx = cxCoords[i];
      const ny = cyCoords[i];
      const nbIdx = neighbors[i];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (barrierMask[nbIdx] === 1) {
          touchesBarrier = true;
        } else if (visited[nbIdx] === 0) {
          const nbPixelIdx = nbIdx * 4;
          if (colorMatch(data, nbPixelIdx, origR, origG, origB, origA, tolerance)) {
            visited[nbIdx] = 1;
            queue[tail++] = nbIdx;
          }
        }
      } else {
        touchesBarrier = true;
      }
    }

    if (touchesBarrier) {
      boundaryPixels.push(curIdx);
    }
  }

  // Step 2: Edge-aware under-bleed expansion into the barrier outline
  // This eliminates white gaps without leaking into adjacent regions because
  // it ONLY paints into barrier pixels (barrierMask === 1) that are not already
  // painted by a different color.
  if (filledCount > 0 && bleedPixels > 0) {
    let currentEdge = boundaryPixels;
    const bleedVisited = new Uint8Array(width * height);

    for (let step = 0; step < bleedPixels; step++) {
      const nextEdge: number[] = [];

      for (let i = 0; i < currentEdge.length; i++) {
        const curIdx = currentEdge[i];
        const cx = curIdx % width;
        const cy = Math.floor(curIdx / width);

        // Check 8-connected neighbors so diagonal line gaps also don't have white pinholes
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = cx + dx;
            const ny = cy + dy;

            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const nbIdx = ny * width + nx;

              // Only expand into barrier pixels that haven't been visited in this bleed step
              if (barrierMask[nbIdx] === 1 && bleedVisited[nbIdx] === 0) {
                const pIdx = nbIdx * 4;
                const pAlpha = data[pIdx + 3];

                // If pixel is empty/transparent or was matching original background, tuck color underneath
                if (pAlpha === 0 || colorMatch(data, pIdx, origR, origG, origB, origA, tolerance + 20)) {
                  data[pIdx] = fillR;
                  data[pIdx + 1] = fillG;
                  data[pIdx + 2] = fillB;
                  data[pIdx + 3] = fillA;

                  bleedVisited[nbIdx] = 1;
                  nextEdge.push(nbIdx);

                  if (nx < minX) minX = nx;
                  if (nx > maxX) maxX = nx;
                  if (ny < minY) minY = ny;
                  if (ny > maxY) maxY = ny;
                }
              }
            }
          }
        }
      }

      currentEdge = nextEdge;
      if (currentEdge.length === 0) break;
    }
  }

  return {
    changed: filledCount > 0,
    minX,
    minY,
    maxX,
    maxY,
  };
}
