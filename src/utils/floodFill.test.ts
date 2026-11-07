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
  // 6x6 test canvas with a closed box from x=1..4, y=1..4
  // Barrier outline at border of box
  const width = 6;
  const height = 6;
  const paintData = new Uint8ClampedArray(width * height * 4);
  // Initial transparent/white paint layer
  paintData.fill(0);

  const barrierMask = new Uint8Array(width * height);
  // Create a 4-walled enclosure at x=1..4, y=1..4
  for (let x = 1; x <= 4; x++) {
    barrierMask[1 * width + x] = 1; // Top wall
    barrierMask[4 * width + x] = 1; // Bottom wall
  }
  for (let y = 1; y <= 4; y++) {
    barrierMask[y * width + 1] = 1; // Left wall
    barrierMask[y * width + 4] = 1; // Right wall
  }

  // Tap inside the box at (2, 2)
  const fillColor: [number, number, number, number] = [255, 0, 0, 255]; // Red
  const result = performFloodFill(
    { width, height, data: paintData },
    barrierMask,
    2,
    2,
    fillColor
  );

  assert.equal(result.changed, true);

  // Inside points (2,2), (3,2), (2,3), (3,3) should be red
  const checkRed = (x: number, y: number) => {
    const idx = (y * width + x) * 4;
    assert.equal(paintData[idx], 255, `pixel (${x},${y}) should be red`);
    assert.equal(paintData[idx + 3], 255, `pixel (${x},${y}) should have full alpha`);
  };

  checkRed(2, 2);
  checkRed(3, 2);
  checkRed(2, 3);
  checkRed(3, 3);

  // Outside point (0, 0) MUST NOT be filled (no leaking over barrier wall!)
  const outsideIdx = 0;
  assert.equal(paintData[outsideIdx], 0, 'outside pixel must not be filled');
  assert.equal(paintData[outsideIdx + 3], 0);

  // Wall point (1, 1) must not be overwritten
  const wallIdx = (1 * width + 1) * 4;
  assert.equal(paintData[wallIdx + 3], 0, 'wall pixel should remain untouched');
});
