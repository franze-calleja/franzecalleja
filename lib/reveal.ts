type RevealEntry = {
  isIntersecting: boolean;
  intersectionRatio: number;
  intersectionRect: { height: number };
  rootBounds: { height: number } | null;
};

/**
 * Whether an IntersectionObserver entry counts as "in view" for a one-shot
 * reveal: enough of the element is visible, or it already fills half the
 * viewport. The second case matters for elements taller than the viewport
 * (e.g. at high zoom), whose visible ratio can never reach the threshold.
 */
export function shouldReveal(entry: RevealEntry, threshold: number): boolean {
  if (!entry.isIntersecting) return false;
  if (entry.intersectionRatio >= threshold) return true;
  const rootHeight = entry.rootBounds?.height ?? 0;
  return rootHeight > 0 && entry.intersectionRect.height >= rootHeight * 0.5;
}
