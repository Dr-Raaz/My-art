/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert';
import {
  getTouchDistance,
  getTouchMidpoint,
  calculateUntransformedCenter,
  computePinchPanStep,
} from './gestureMath';

test('getTouchDistance and getTouchMidpoint calculate correctly', () => {
  const p1 = { clientX: 100, clientY: 100 };
  const p2 = { clientX: 100, clientY: 200 };

  const dist = getTouchDistance(p1, p2);
  assert.strictEqual(dist, 100);

  const mid = getTouchMidpoint(p1, p2);
  assert.deepStrictEqual(mid, { x: 100, y: 150 });
});

test('calculateUntransformedCenter extracts origin regardless of pan and scale', () => {
  // Suppose element transformed with pan = (50, 30)
  // Bounding rect has center at (450, 430)
  const rect = { left: 150, top: 130, width: 600, height: 600 };
  const center = calculateUntransformedCenter(rect, { x: 50, y: 30 });
  assert.deepStrictEqual(center, { x: 400, y: 400 });
});

test('computePinchPanStep handles pure two-finger pan without zoom change', () => {
  const baseMid = { x: 200, y: 200 };
  const currentMid = { x: 230, y: 250 }; // moved +30, +50
  const center = { x: 200, y: 200 };

  const res = computePinchPanStep({
    currentDist: 100,
    currentMid,
    baseDist: 100, // same distance -> scale = 1.0
    baseMid,
    baseZoom: 2.0,
    basePan: { x: 0, y: 0 },
    untransformedCenter: center,
    displayWidth: 400,
    displayHeight: 400,
    containerWidth: 400,
    containerHeight: 400,
  });

  assert.strictEqual(res.zoom, 2.0);
  assert.strictEqual(res.pan.x, 30);
  assert.strictEqual(res.pan.y, 50);
});

test('computePinchPanStep handles pinch zoom around focal point', () => {
  const center = { x: 400, y: 400 };
  // User pinches around focal point at (500, 400) which is 100px to the right of center
  const focalPoint = { x: 500, y: 400 };

  const res = computePinchPanStep({
    currentDist: 200, // doubled distance -> zoom 1.0 * 2.0 = 2.0
    currentMid: focalPoint,
    baseDist: 100,
    baseMid: focalPoint,
    baseZoom: 1.0,
    basePan: { x: 0, y: 0 },
    untransformedCenter: center,
    displayWidth: 600,
    displayHeight: 600,
    containerWidth: 800,
    containerHeight: 800,
  });

  assert.strictEqual(res.zoom, 2.0);
  // Point at 500 should stay at 500.
  // With zoom 2.0 and center 400: (500 - 400) was 100 from center.
  // At zoom 2.0, that artwork point is at 400 + 100*2 = 600 without pan.
  // To keep it at 500 on screen, pan must be 500 - 600 = -100!
  assert.strictEqual(res.pan.x, -100);
  assert.strictEqual(res.pan.y, 0);
});

test('computePinchPanStep clamps zoom between minZoom and maxZoom', () => {
  const center = { x: 200, y: 200 };
  const mid = { x: 200, y: 200 };

  // Pinching way too small (e.g. 0.2x)
  const resMin = computePinchPanStep({
    currentDist: 20,
    currentMid: mid,
    baseDist: 100,
    baseMid: mid,
    baseZoom: 1.0,
    basePan: { x: 0, y: 0 },
    untransformedCenter: center,
    displayWidth: 400,
    displayHeight: 400,
    containerWidth: 400,
    containerHeight: 400,
  });

  assert.strictEqual(resMin.zoom, 1.0);
  assert.deepStrictEqual(resMin.pan, { x: 0, y: 0 });
  assert.strictEqual(resMin.rebaseNeeded, true);

  // Spreading fingers way too far (e.g. 10x)
  const resMax = computePinchPanStep({
    currentDist: 1000,
    currentMid: mid,
    baseDist: 100,
    baseMid: mid,
    baseZoom: 1.0,
    basePan: { x: 0, y: 0 },
    untransformedCenter: center,
    displayWidth: 400,
    displayHeight: 400,
    containerWidth: 400,
    containerHeight: 400,
  });

  assert.strictEqual(resMax.zoom, 4.0);
  assert.strictEqual(resMax.rebaseNeeded, true);
});
