/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { calculatePaintCoverage } from './previewCoverage';

test('calculatePaintCoverage returns 0 for empty / completely transparent paint canvas', () => {
  const width = 10;
  const height = 10;
  const totalPixels = width * height;
  const paintData = new Uint8ClampedArray(totalPixels * 4); // all zeros
  const barrierMask = new Uint8Array(totalPixels); // all paintable

  const coverage = calculatePaintCoverage(paintData, barrierMask, width, height);
  assert.strictEqual(coverage, 0);
});

test('calculatePaintCoverage calculates exact percentage of paintable area', () => {
  const width = 10;
  const height = 10;
  const totalPixels = width * height; // 100 pixels
  const paintData = new Uint8ClampedArray(totalPixels * 4);
  const barrierMask = new Uint8Array(totalPixels);

  // 20 pixels are barrier outlines (80 paintable pixels)
  for (let i = 0; i < 20; i++) {
    barrierMask[i] = 1;
  }

  // Paint 40 of the paintable pixels
  for (let i = 20; i < 60; i++) {
    paintData[i * 4 + 0] = 255; // R
    paintData[i * 4 + 1] = 0;   // G
    paintData[i * 4 + 2] = 0;   // B
    paintData[i * 4 + 3] = 255; // Alpha
  }

  // 40 painted out of 80 paintable = 50%
  const coverage = calculatePaintCoverage(paintData, barrierMask, width, height);
  assert.strictEqual(coverage, 50);
});

test('calculatePaintCoverage ignores paint on barrier outline pixels', () => {
  const width = 4;
  const height = 4;
  const totalPixels = 16;
  const paintData = new Uint8ClampedArray(totalPixels * 4);
  const barrierMask = new Uint8Array(totalPixels);

  // Pixel 0 is barrier
  barrierMask[0] = 1;

  // Paint pixel 0 (barrier)
  paintData[0 * 4 + 3] = 255;

  // Paint pixel 1 (paintable)
  paintData[1 * 4 + 3] = 255;

  // Total paintable is 15. Painted paintable is 1.
  // 1 / 15 = 6.66% -> rounds to 7%
  const coverage = calculatePaintCoverage(paintData, barrierMask, width, height);
  assert.strictEqual(coverage, 7);
});

test('calculatePaintCoverage returns at least 1% if any paintable pixel is colored', () => {
  const width = 100;
  const height = 100; // 10,000 pixels
  const totalPixels = width * height;
  const paintData = new Uint8ClampedArray(totalPixels * 4);
  const barrierMask = new Uint8Array(totalPixels);

  // Paint just 1 pixel (0.01% -> would normally round to 0)
  paintData[0 * 4 + 3] = 255;

  const coverage = calculatePaintCoverage(paintData, barrierMask, width, height);
  assert.strictEqual(coverage, 1);
});

test('calculatePaintCoverage returns 100% when fully colored', () => {
  const width = 5;
  const height = 5;
  const totalPixels = width * height;
  const paintData = new Uint8ClampedArray(totalPixels * 4);
  const barrierMask = new Uint8Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    paintData[i * 4 + 3] = 255;
  }

  const coverage = calculatePaintCoverage(paintData, barrierMask, width, height);
  assert.strictEqual(coverage, 100);
});
