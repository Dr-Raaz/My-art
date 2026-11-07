/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { clampPanOffset } from './coordinateTransform';

export interface Point {
  x: number;
  y: number;
}

export interface TouchPoint {
  clientX: number;
  clientY: number;
}

export interface PinchPanParams {
  currentDist: number;
  currentMid: Point;
  baseDist: number;
  baseMid: Point;
  baseZoom: number;
  basePan: Point;
  untransformedCenter: Point;
  minZoom?: number;
  maxZoom?: number;
  displayWidth: number;
  displayHeight: number;
  containerWidth: number;
  containerHeight: number;
}

export interface PinchPanResult {
  zoom: number;
  pan: Point;
  rebaseNeeded: boolean;
}

/**
 * Calculates Euclidean distance between two touch points.
 */
export function getTouchDistance(touch1: TouchPoint, touch2: TouchPoint): number {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates midpoint between two touch points.
 */
export function getTouchMidpoint(touch1: TouchPoint, touch2: TouchPoint): Point {
  return {
    x: (touch1.clientX + touch2.clientX) / 2,
    y: (touch1.clientY + touch2.clientY) / 2,
  };
}

/**
 * Calculates untransformed center of an element with CSS transform origin 'center center'.
 */
export function calculateUntransformedCenter(
  rect: { left: number; top: number; width: number; height: number },
  currentPan: Point
): Point {
  const currentCenterX = rect.left + rect.width / 2;
  const currentCenterY = rect.top + rect.height / 2;
  return {
    x: currentCenterX - currentPan.x,
    y: currentCenterY - currentPan.y,
  };
}

/**
 * Computes new zoom level and pan offset for simultaneous two-finger pinch-to-zoom
 * and pan gestures, keeping the focal point stable beneath fingers.
 */
export function computePinchPanStep({
  currentDist,
  currentMid,
  baseDist,
  baseMid,
  baseZoom,
  basePan,
  untransformedCenter,
  minZoom = 1.0,
  maxZoom = 4.0,
  displayWidth,
  displayHeight,
  containerWidth,
  containerHeight,
}: PinchPanParams): PinchPanResult {
  if (baseDist <= 0 || currentDist <= 0) {
    return {
      zoom: baseZoom,
      pan: basePan,
      rebaseNeeded: false,
    };
  }

  // Calculate raw scale change
  const scaleMultiplier = currentDist / baseDist;
  const rawZoom = baseZoom * scaleMultiplier;

  // Clamp zoom to [minZoom, maxZoom]
  const clampedZoom = Math.max(minZoom, Math.min(maxZoom, rawZoom));
  const rebaseNeeded = rawZoom <= minZoom || rawZoom >= maxZoom;

  // Scale ratio relative to the gesture base
  const s = clampedZoom / baseZoom;

  // Artwork point under baseMid must stay under currentMid:
  // currentMid - (C + pan) = s * (baseMid - (C + basePan))
  // pan = currentMid - C - s * (baseMid - C - basePan)
  const C = untransformedCenter;
  const targetPanX = currentMid.x - C.x - s * (baseMid.x - C.x - basePan.x);
  const targetPanY = currentMid.y - C.y - s * (baseMid.y - C.y - basePan.y);

  if (clampedZoom <= 1.0) {
    return {
      zoom: 1.0,
      pan: { x: 0, y: 0 },
      rebaseNeeded,
    };
  }

  const clampedPan = clampPanOffset(
    targetPanX,
    targetPanY,
    clampedZoom,
    displayWidth,
    displayHeight,
    containerWidth,
    containerHeight
  );

  return {
    zoom: clampedZoom,
    pan: clampedPan,
    rebaseNeeded,
  };
}
