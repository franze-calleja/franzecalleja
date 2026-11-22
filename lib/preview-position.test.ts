import { describe, it, expect } from "vitest";
import { previewPosition } from "./preview-position";

const viewport = { width: 1440, height: 900 };
const card = { width: 360, height: 260 };

describe("previewPosition", () => {
  it("places the card to the right of the cursor, vertically centred on it", () => {
    expect(previewPosition({ x: 400, y: 450 }, card, viewport)).toEqual({ x: 424, y: 320 });
  });

  it("flips to the left of the cursor near the right edge", () => {
    expect(previewPosition({ x: 1200, y: 450 }, card, viewport)).toEqual({ x: 1200 - 360 - 24, y: 320 });
  });

  it("keeps the card below the top padding", () => {
    expect(previewPosition({ x: 400, y: 40 }, card, viewport).y).toBe(20);
  });

  it("keeps the card above the bottom padding", () => {
    expect(previewPosition({ x: 400, y: 880 }, card, viewport).y).toBe(900 - 260 - 20);
  });
});
