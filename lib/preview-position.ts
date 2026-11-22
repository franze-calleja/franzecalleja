type Point = { x: number; y: number };
type Size = { width: number; height: number };

const GAP = 24;
const PADDING = 20;

/**
 * Where the hover preview card sits for a cursor at `cursor`: beside it,
 * vertically centred, flipped to the left near the right edge and kept
 * inside the viewport's padding.
 */
export function previewPosition(cursor: Point, card: Size, viewport: Size): Point {
  let x = cursor.x + GAP;
  if (x + card.width > viewport.width - PADDING) x = cursor.x - card.width - GAP;

  const y = Math.min(
    Math.max(cursor.y - card.height / 2, PADDING),
    viewport.height - card.height - PADDING,
  );
  return { x, y };
}
