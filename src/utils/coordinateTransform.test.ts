/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  screenToArtworkCoords,
  calculateFitDimensions,
  clampPanOffset,
} from './coordinateTransform';

test('screenToArtworkCoords accurately translates coordinates at 1x scale', () => {
  const canvasRect = { left: 100, top: 50, width: 400, height: 400 };
  const artworkWidth = 800;
  const artworkHeight = 800;

  // Center click: x=300 (100 + 200), y=250 (50 + 200)
  const center = screenToArtworkCoords(300, 250, canvasRect, artworkWidth, artworkHeight);
  assert.deepEqual(center, { x: 400, y: 400 });

  // Top-left click: x=100, y=50
  const topLeft = screenToArtworkCoords(100, 50, canvasRect, artworkWidth, artworkHeight);
  assert.deepEqual(topLeft, { x: 0, y: 0 });

  // Bottom-right click: x=500, y=450
  const bottomRight = screenToArtworkCoords(500, 450, canvasRect, artworkWidth, artworkHeight);
  assert.deepEqual(bottomRight, { x: 799, y: 799 });
});

test('screenToArtworkCoords accurately translates coordinates when zoomed and panned', () => {
  // Suppose zoomed 2.5x and panned so the canvas on screen is 1000px wide, located at left: -200, top: -150
  const canvasRect = { left: -200, top: -150, width: 1000, height: 1000 };
  const artworkWidth = 800;
  const artworkHeight = 800;

  // Click on screen at (300, 350)
  // relX = (300 - (-200)) / 1000 = 500 / 1000 = 0.5
  // relY = (350 - (-150)) / 1000 = 500 / 1000 = 0.5
  const coords = screenToArtworkCoords(300, 350, canvasRect, artworkWidth, artworkHeight);
  assert.deepEqual(coords, { x: 400, y: 400 });

  // Click at the top-left of the zoomed artwork (on-screen at -200, -150)
  const zoomedTopLeft = screenToArtworkCoords(-200, -150, canvasRect, artworkWidth, artworkHeight);
  assert.deepEqual(zoomedTopLeft, { x: 0, y: 0 });
});

test('screenToArtworkCoords returns null for clicks outside canvas boundary', () => {
  const canvasRect = { left: 100, top: 100, width: 400, height: 400 };
  const artworkWidth = 800;
  const artworkHeight = 800;

  // Far outside left (e.g. x=20)
  assert.equal(screenToArtworkCoords(20, 200, canvasRect, artworkWidth, artworkHeight), null);
  // Far outside right (e.g. x=600)
  assert.equal(screenToArtworkCoords(600, 200, canvasRect, artworkWidth, artworkHeight), null);
});

test('calculateFitDimensions preserves artwork aspect ratio', () => {
  // Container: 500w x 600h, Artwork: 800w x 800h (square)
  const fitSquare = calculateFitDimensions(500, 600, 800, 800, 0);
  assert.equal(fitSquare.width, 500);
  assert.equal(fitSquare.height, 500);

  // Wide artwork: 1600w x 800h (2:1 aspect) inside 800w x 600h
  const fitWide = calculateFitDimensions(800, 600, 1600, 800, 0);
  assert.equal(fitWide.width, 800);
  assert.equal(fitWide.height, 400);
});

test('clampPanOffset keeps pan offset bounded', () => {
  // At zoom = 1, pan is always reset to (0, 0)
  const noZoomPan = clampPanOffset(100, 100, 1, 400, 400, 500, 500);
  assert.deepEqual(noZoomPan, { x: 0, y: 0 });

  // At zoom = 2, pan is clamped within reasonable limits
  const zoomedPan = clampPanOffset(1000, -1000, 2, 400, 400, 500, 500);
  assert.ok(Math.abs(zoomedPan.x) < 1000);
  assert.ok(Math.abs(zoomedPan.y) < 1000);
});
