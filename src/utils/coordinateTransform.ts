/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Accurately translates client/touch/stylus screen coordinates into original artwork pixel coordinates.
 * Handles any zoom scale, pan translation, canvas position, and aspect ratio.
 */
export function screenToArtworkCoords(
  clientX: number,
  clientY: number,
  canvasRect: ScreenRect,
  artworkWidth: number,
  artworkHeight: number
): { x: number; y: number } | null {
  if (!canvasRect || canvasRect.width <= 0 || canvasRect.height <= 0) {
    return null;
  }

  const relX = (clientX - canvasRect.left) / canvasRect.width;
  const relY = (clientY - canvasRect.top) / canvasRect.height;

  // Check bounds with slight tolerance for border touches
  if (relX < -0.01 || relX > 1.01 || relY < -0.01 || relY > 1.01) {
    return null;
  }

  const clampedRelX = Math.max(0, Math.min(1, relX));
  const clampedRelY = Math.max(0, Math.min(1, relY));

  const x = Math.min(artworkWidth - 1, Math.max(0, Math.floor(clampedRelX * artworkWidth)));
  const y = Math.min(artworkHeight - 1, Math.max(0, Math.floor(clampedRelY * artworkHeight)));

  return { x, y };
}

/**
 * Computes base display dimensions to fit an artwork within a viewport container
 * preserving its exact aspect ratio.
 */
export function calculateFitDimensions(
  containerWidth: number,
  containerHeight: number,
  artworkWidth: number,
  artworkHeight: number,
  padding = 16
): { width: number; height: number } {
  const availW = Math.max(100, containerWidth - padding * 2);
  const availH = Math.max(100, containerHeight - padding * 2);

  const artworkAspect = artworkWidth / artworkHeight;
  const availAspect = availW / availH;

  if (availAspect > artworkAspect) {
    // Height constrained
    const h = Math.round(availH);
    const w = Math.round(availH * artworkAspect);
    return { width: w, height: h };
  } else {
    // Width constrained
    const w = Math.round(availW);
    const h = Math.round(availW / artworkAspect);
    return { width: w, height: h };
  }
}

/**
 * Clamps pan offset so the artwork stays accessible within the viewport when zoomed.
 */
export function clampPanOffset(
  panX: number,
  panY: number,
  zoom: number,
  displayWidth: number,
  displayHeight: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  if (zoom <= 1) {
    return { x: 0, y: 0 };
  }

  const zoomedW = displayWidth * zoom;
  const zoomedH = displayHeight * zoom;

  // Allowed pan range allows navigating any portion of the artwork into the viewport
  const maxPanX = Math.max(40, (zoomedW - Math.min(containerWidth, displayWidth)) / 2 + 80);
  const maxPanY = Math.max(40, (zoomedH - Math.min(containerHeight, displayHeight)) / 2 + 80);

  return {
    x: Math.max(-maxPanX, Math.min(maxPanX, panX)),
    y: Math.max(-maxPanY, Math.min(maxPanY, panY)),
  };
}
