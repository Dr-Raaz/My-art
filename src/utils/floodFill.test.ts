/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hexToRgba,
  rgbaToHex,
  getLuminance,
  buildBarrierMask,
  performFloodFill,
  createOutlineOverlay,
} from './floodFill';

test('hexToRgba correctly parses 6-digit and 3-digit hex colors', () => {
  assert.deepEqual(hexToRgba('#EF4444'), [239, 68, 68, 255]);
  assert.deepEqual(hexToRgba('#000000'), [0, 0, 0, 255]);
  assert.deepEqual(hexToRgba('#FFF'), [255, 255, 255, 255]);
  assert.deepEqual(hexToRgba('#F00', 128), [255, 0, 0, 128]);
});

test('rgbaToHex converts RGB values to valid hex code', () => {
  assert.equal(rgbaToHex(255, 255, 255).toUpperCase(), '#FFFFFF');
  assert.equal(rgbaToHex(0, 0, 0).toUpperCase(), '#000000');
  assert.equal(rgbaToHex(239, 68, 68).toUpperCase(), '#EF4444');
});

test('getLuminance identifies dark vs bright pixels correctly', () => {
  const blackLum = getLuminance(0, 0, 0, 255);
  const whiteLum = getLuminance(255, 255, 255, 255);
  const greyLum = getLuminance(128, 128, 128, 255);

  assert.equal(blackLum, 0);
  assert.equal(whiteLum, 255);
  assert.ok(blackLum < 50);
  assert.ok(whiteLum > 200);
  assert.ok(greyLum > 100 && greyLum < 150);
});

test('buildBarrierMask marks dark outline pixels as barriers and white pixels as fillable', () => {
  // 4x4 image with a vertical black divider line at x=2
  const width = 4;
  const height = 4;
  const data = new Uint8ClampedArray(width * height * 4);

  // Fill with white (255, 255, 255, 255)
  data.fill(255);

  // Set column x=2 to black outline (0, 0, 0, 255)
  for (let y = 0; y < height; y++) {
    const idx = (y * width + 2) * 4;
    data[idx] = 0;
    data[idx + 1] = 0;
    data[idx + 2] = 0;
    data[idx + 3] = 255;
  }

  const mask = buildBarrierMask({ width, height, data }, 190, 0);

  // Verify x=0,1 are 0 (free) and x=2 is 1 (barrier)
  assert.equal(mask[0], 0);
  assert.equal(mask[1], 0);
  assert.equal(mask[2], 1); // Barrier at (2,0)
  assert.equal(mask[3], 0);
  assert.equal(mask[1 * width + 2], 1); // Barrier at (2,1)
});

test('performFloodFill fills enclosed region and stops strictly at barrier boundaries', () => {
  // 10x10 test canvas with a closed box from x=2..7, y=2..7
  const width = 10;
  const height = 10;
  const paintData = new Uint8ClampedArray(width * height * 4);
  paintData.fill(0);

  const barrierMask = new Uint8Array(width * height);
  // Create an outline box of thickness 2 (x=2,3 and x=6,7, y=2,3 and y=6,7)
  for (let x = 2; x <= 7; x++) {
    barrierMask[2 * width + x] = 1;
    barrierMask[3 * width + x] = 1;
    barrierMask[6 * width + x] = 1;
    barrierMask[7 * width + x] = 1;
  }
  for (let y = 2; y <= 7; y++) {
    barrierMask[y * width + 2] = 1;
    barrierMask[y * width + 3] = 1;
    barrierMask[y * width + 6] = 1;
    barrierMask[y * width + 7] = 1;
  }

  // Tap inside the box at (4, 4)
  const fillColor: [number, number, number, number] = [255, 0, 0, 255]; // Red
  const result = performFloodFill(
    { width, height, data: paintData },
    barrierMask,
    4,
    4,
    fillColor,
    24,
    1 // 1px under-bleed into barrier
  );

  assert.equal(result.changed, true);

  // Core inside pixels (4,4), (5,4), (4,5), (5,5) must be red
  const checkRed = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    assert.equal(paintData[idx], 255, `pixel (${x},${y}) should be red`);
    assert.equal(paintData[idx + 3], 255, `pixel (${x},${y}) should have full alpha`);
  };

  checkRed(4, 4);
  checkRed(5, 4);
  checkRed(4, 5);
  checkRed(5, 5);

  // Under-bleed: Inner edge of the wall (e.g. (3, 4)) should also be filled red so NO white gap exists!
  checkRed(3, 4);

  // Outside pixels (0, 0), (9, 9) MUST NOT be filled (no leaking over barrier wall!)
  const outsideIdx = 0;
  assert.equal(paintData[outsideIdx], 0, 'outside pixel must not be filled');
  assert.equal(paintData[outsideIdx + 3], 0);

  const outsideRightIdx = (9 * width + 9) * 4;
  assert.equal(paintData[outsideRightIdx], 0);
});

test('createOutlineOverlay converts white to transparent and preserves line darkness', () => {
  const width = 2;
  const height = 1;
  const data = new Uint8ClampedArray(8);

  // Pixel 0: White background (255, 255, 255, 255)
  data[0] = 255; data[1] = 255; data[2] = 255; data[3] = 255;
  // Pixel 1: Black outline (0, 0, 0, 255)
  data[4] = 0; data[5] = 0; data[6] = 0; data[7] = 255;

  const overlay = createOutlineOverlay({ width, height, data }, 245);

  // Pixel 0 should be fully transparent
  assert.equal(overlay.data[3], 0);
  // Pixel 1 should have high opacity
  assert.ok(overlay.data[7] >= 250);
});
