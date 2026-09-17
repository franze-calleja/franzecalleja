/**
 * D-pad hit geometry.
 *
 * Kept separate from the React component so the "which way is the thumb
 * pointing" decision is a pure function that can be tested without a DOM.
 *
 * The on-screen pad is a plus shape, but resolving a touch by which grid
 * cell it lands in makes sliding feel broken: drag a thumb from the up arm
 * toward the right arm and the diagonal corner between them reads as "no
 * direction", so movement stutters mid-slide. Instead the whole pad square
 * is live and the direction is whichever axis the touch is further along
 * from centre, with a dead zone in the middle to release. Corners resolve
 * to their dominant axis rather than to nothing, so a slide stays smooth.
 */

export type DpadDirection = "up" | "down" | "left" | "right";

export interface DpadBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Radius of the central release zone, as a fraction of the pad's shorter
 * side. Must stay under 1/6 (~0.167): the pad renders as a 3x3 grid, so the
 * centre cell reaches 1/6 of the pad's width out from the middle, and a
 * larger radius would swallow the inner end of each arm. 0.15 sits just
 * inside that, so sliding a thumb back to the middle releases cleanly
 * without shrinking the usable arms.
 */
export const DPAD_DEAD_ZONE_RATIO = 0.15;

/**
 * Maps a pointer position to a direction, or null when the pointer is in
 * the central dead zone (or the pad has no layout yet, e.g. a zero-sized
 * rect from an unmounted node — treated as "no input" rather than dividing
 * by zero).
 *
 * On an exact diagonal tie the vertical axis wins; the choice is arbitrary
 * but fixed, so the same touch never oscillates between two directions.
 */
export function resolveDpadDirection(
  clientX: number,
  clientY: number,
  bounds: DpadBounds,
): DpadDirection | null {
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  const dx = clientX - (bounds.left + bounds.width / 2);
  const dy = clientY - (bounds.top + bounds.height / 2);

  const deadZone = Math.min(bounds.width, bounds.height) * DPAD_DEAD_ZONE_RATIO;
  if (Math.hypot(dx, dy) < deadZone) return null;

  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "down" : "up";
}
