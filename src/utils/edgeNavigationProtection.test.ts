/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isEdgeNavigationZone,
  getEdgeZoneWidth,
  EdgeNavigationGuard,
  DEFAULT_EDGE_ZONE_PX,
} from './edgeNavigationProtection';

describe('Edge Navigation Protection', () => {
  it('correctly calculates edge zone widths across devices', () => {
    // 390px viewport width (standard iPhone / Pixel)
    const zone390 = getEdgeZoneWidth(390);
    assert.strictEqual(zone390, 27); // Math.round(390 * 0.07) = 27

    // 320px viewport width (small phone)
    const zone320 = getEdgeZoneWidth(320);
    assert.strictEqual(zone320, 22); // Math.max(22, 22.4) = 22

    // 768px viewport width (tablet)
    const zone768 = getEdgeZoneWidth(768);
    assert.strictEqual(zone768, 32); // clamped at 32px max

    // Custom override
    assert.strictEqual(getEdgeZoneWidth(390, 30), 30);
  });

  it('identifies left edge and right edge zones accurately on 390px screen', () => {
    const viewportWidth = 390;
    const zoneWidth = 26;

    // Left edge zone (< 26px)
    assert.strictEqual(isEdgeNavigationZone(0, viewportWidth, zoneWidth), true);
    assert.strictEqual(isEdgeNavigationZone(10, viewportWidth, zoneWidth), true);
    assert.strictEqual(isEdgeNavigationZone(26, viewportWidth, zoneWidth), true);

    // Inside normal drawing area
    assert.strictEqual(isEdgeNavigationZone(27, viewportWidth, zoneWidth), false);
    assert.strictEqual(isEdgeNavigationZone(195, viewportWidth, zoneWidth), false); // center of screen
    assert.strictEqual(isEdgeNavigationZone(363, viewportWidth, zoneWidth), false);

    // Right edge zone (>= 390 - 26 = 364px)
    assert.strictEqual(isEdgeNavigationZone(364, viewportWidth, zoneWidth), true);
    assert.strictEqual(isEdgeNavigationZone(380, viewportWidth, zoneWidth), true);
    assert.strictEqual(isEdgeNavigationZone(390, viewportWidth, zoneWidth), true);
  });

  it('handles invalid or zero viewport width safely', () => {
    assert.strictEqual(isEdgeNavigationZone(10, 0), false);
    assert.strictEqual(isEdgeNavigationZone(10, -100), false);
  });

  it('EdgeNavigationGuard excludes entire touch sequence starting at left edge', () => {
    const guard = new EdgeNavigationGuard(26);
    const viewportWidth = 390;

    // 1. Touch starts at left edge (x = 12)
    const isEdge1 = guard.registerPointerDown(101, 12, viewportWidth, true);
    assert.strictEqual(isEdge1, true);
    assert.strictEqual(guard.isIgnored(101), true);

    // 2. Finger glides across center of the artwork (x = 150, then x = 200)
    // Guard must STILL mark this sequence as ignored!
    assert.strictEqual(guard.isIgnored(101), true);

    // 3. Pointer released
    const wasIgnored = guard.releasePointer(101);
    assert.strictEqual(wasIgnored, true);
    assert.strictEqual(guard.isIgnored(101), false);
  });

  it('EdgeNavigationGuard excludes entire touch sequence starting at right edge', () => {
    const guard = new EdgeNavigationGuard(26);
    const viewportWidth = 390;

    // 1. Touch starts at right edge (x = 382)
    const isEdge2 = guard.registerPointerDown(102, 382, viewportWidth, true);
    assert.strictEqual(isEdge2, true);
    assert.strictEqual(guard.isIgnored(102), true);

    // 2. Finger glides inward towards center (x = 180)
    assert.strictEqual(guard.isIgnored(102), true);

    // 3. Pointer released
    assert.strictEqual(guard.releasePointer(102), true);
    assert.strictEqual(guard.isIgnored(102), false);
  });

  it('EdgeNavigationGuard preserves normal touches inside the canvas', () => {
    const guard = new EdgeNavigationGuard(26);
    const viewportWidth = 390;

    // Normal touch starts inside canvas (x = 100)
    const isEdge = guard.registerPointerDown(201, 100, viewportWidth, true);
    assert.strictEqual(isEdge, false);
    assert.strictEqual(guard.isIgnored(201), false);

    // Normal touch moves
    assert.strictEqual(guard.isIgnored(201), false);

    // Released
    assert.strictEqual(guard.releasePointer(201), false);
  });

  it('EdgeNavigationGuard does not block desktop mouse clicks near screen edge', () => {
    const guard = new EdgeNavigationGuard(26);
    const viewportWidth = 390;

    // Desktop mouse click at x = 10 (not touch)
    const isEdge = guard.registerPointerDown(301, 10, viewportWidth, false);
    assert.strictEqual(isEdge, false);
    assert.strictEqual(guard.isIgnored(301), false);
  });

  it('clears all tracked pointers on reset', () => {
    const guard = new EdgeNavigationGuard(26);
    guard.registerPointerDown(1, 5, 390, true);
    guard.registerPointerDown(2, 385, 390, true);
    assert.strictEqual(guard.ignoredCount, 2);

    guard.clear();
    assert.strictEqual(guard.ignoredCount, 0);
    assert.strictEqual(guard.isIgnored(1), false);
    assert.strictEqual(guard.isIgnored(2), false);
  });
});
