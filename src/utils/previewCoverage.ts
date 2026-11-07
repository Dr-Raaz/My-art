/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the approximate percentage of paintable area that has been colored.
 *
 * @param paintData - The Uint8ClampedArray of the paint canvas (RGBA).
 * @param barrierMask - The Uint8Array where 1 = barrier/outline, 0 = paintable pixel.
 * @param width - Canvas width in pixels.
 * @param height - Canvas height in pixels.
 * @returns Approximate percentage colored (0 to 100).
 */
export function calculatePaintCoverage(
  paintData: Uint8ClampedArray,
  barrierMask: Uint8Array | null,
  width: number,
  height: number
): number {
  const totalPixels = width * height;
  if (totalPixels <= 0 || !paintData || paintData.length < totalPixels * 4) {
    return 0;
  }

  let paintableCount = 0;
  let paintedCount = 0;

  for (let i = 0; i < totalPixels; i++) {
    const isBarrier = barrierMask ? barrierMask[i] === 1 : false;
    if (!isBarrier) {
      paintableCount++;
      // Check alpha channel of paint canvas pixel
      const alpha = paintData[i * 4 + 3];
      if (alpha > 15) {
        paintedCount++;
      }
    }
  }

  if (paintableCount === 0) {
    return 0;
  }

  const rawPercent = Math.round((paintedCount / paintableCount) * 100);
  // If at least one pixel is painted, show at least 1%
  if (paintedCount > 0 && rawPercent === 0) {
    return 1;
  }

  return Math.min(100, Math.max(0, rawPercent));
}

/**
 * Generates an optimized composite PNG thumbnail data URL containing:
 * 1. White background.
 * 2. Colored paint layer.
 * 3. Original black outline layer on top.
 *
 * Sized to approximately maxDimension (400–600px) on its longest side.
 */
export function generateCompositeThumbnail(
  paintCanvas: HTMLCanvasElement,
  outlineCanvas: HTMLCanvasElement | null,
  maxDimension = 500
): string {
  if (typeof document === 'undefined') return '';

  const origW = paintCanvas.width;
  const origH = paintCanvas.height;
  if (origW <= 0 || origH <= 0) return '';

  const scale = Math.min(1, maxDimension / Math.max(origW, origH));
  const thumbW = Math.max(10, Math.round(origW * scale));
  const thumbH = Math.max(10, Math.round(origH * scale));

  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = thumbW;
  thumbCanvas.height = thumbH;
  const ctx = thumbCanvas.getContext('2d');
  if (!ctx) return '';

  // 1. Pure solid white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, thumbW, thumbH);

  // 2. Colored paint layer underneath
  ctx.drawImage(paintCanvas, 0, 0, thumbW, thumbH);

  // 3. Crisp outlines on top
  if (outlineCanvas) {
    ctx.drawImage(outlineCanvas, 0, 0, thumbW, thumbH);
  }

  return thumbCanvas.toDataURL('image/png');
}
