/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Default narrow navigation zone width (in CSS pixels) along the screen edges.
 * Standard Android back gesture triggers from the outer 20-28px.
 * We use 26px (or ~7% on small screens, clamped between 22px and 32px)
 * to catch swipe gestures without encroaching into the active canvas drawing area.
 */
export const DEFAULT_EDGE_ZONE_PX = 26;

/**
 * Calculates the edge navigation zone width based on screen width.
 */
export function getEdgeZoneWidth(viewportWidth: number, customZoneWidth?: number): number {
  if (customZoneWidth !== undefined && customZoneWidth > 0) {
    return customZoneWidth;
  }
  if (viewportWidth <= 0) return DEFAULT_EDGE_ZONE_PX;
  // Scaled for devices: min 22px (e.g. 320px screen), max 32px (large phone/tablet), standard ~26px (390px phone)
  return Math.max(22, Math.min(32, Math.round(viewportWidth * 0.07)));
}

/**
 * Determines whether a given horizontal screen coordinate falls within the
 * left or right edge navigation zone of the screen.
 *
 * @param clientX - Horizontal position of the pointer in screen viewport pixels
 * @param viewportWidth - Total viewport width (window.innerWidth)
 * @param zoneWidth - Optional custom zone width
 * @returns true if inside either left or right edge zone
 */
export function isEdgeNavigationZone(
  clientX: number,
  viewportWidth: number,
  zoneWidth?: number
): boolean {
  if (viewportWidth <= 0) return false;
  const effectiveZone = getEdgeZoneWidth(viewportWidth, zoneWidth);
  return clientX <= effectiveZone || clientX >= viewportWidth - effectiveZone;
}

/**
 * Manages pointer sequences to protect the canvas from accidental painting
 * during native Android system edge-swipe back gestures.
 *
 * Crucial behavior:
 * - If a pointer starts within the edge zone, its sequence is flagged.
 * - Even if the finger glides deep into the center of the canvas, the entire
 *   sequence remains completely excluded from canvas operations.
 * - Native browser gestures are preserved by avoiding pointer capture or
 *   preventDefault on edge pointers.
 * - Normal touches starting inside the regular canvas area are completely unhindered.
 */
export class EdgeNavigationGuard {
  private ignoredPointerIds = new Set<number>();
  private customZoneWidth?: number;

  constructor(customZoneWidth?: number) {
    this.customZoneWidth = customZoneWidth;
  }

  /**
   * Registers a pointer-down event.
   * If the pointer started in an edge navigation zone, it is tracked as an edge sequence.
   *
   * @param pointerId - Unique pointer identifier
   * @param clientX - Pointer screen horizontal coordinate
   * @param viewportWidth - Window innerWidth
   * @param isTouchOrPen - Whether the pointer originates from touch or pen (false for desktop mouse)
   * @returns true if this pointer sequence is an edge navigation gesture to be excluded from canvas
   */
  public registerPointerDown(
    pointerId: number,
    clientX: number,
    viewportWidth: number,
    isTouchOrPen: boolean
  ): boolean {
    // Edge swipe navigation gestures are touch interactions
    if (!isTouchOrPen) {
      return false;
    }

    if (isEdgeNavigationZone(clientX, viewportWidth, this.customZoneWidth)) {
      this.ignoredPointerIds.add(pointerId);
      return true;
    }

    return false;
  }

  /**
   * Checks whether the given pointerId belongs to an edge navigation sequence.
   */
  public isIgnored(pointerId: number): boolean {
    return this.ignoredPointerIds.has(pointerId);
  }

  /**
   * Unregisters a pointer on pointer-up or pointer-cancel.
   * @returns true if the released pointer was an edge sequence
   */
  public releasePointer(pointerId: number): boolean {
    const wasIgnored = this.ignoredPointerIds.has(pointerId);
    if (wasIgnored) {
      this.ignoredPointerIds.delete(pointerId);
    }
    return wasIgnored;
  }

  /**
   * Clears all registered pointers.
   */
  public clear(): void {
    this.ignoredPointerIds.clear();
  }

  /**
   * Returns count of active ignored edge pointers.
   */
  public get ignoredCount(): number {
    return this.ignoredPointerIds.size;
  }
}
