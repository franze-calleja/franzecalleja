export const KONAMI_SEQUENCE = [
  "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
  "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a",
] as const;

export function createSequenceMatcher(sequence: readonly string[]) {
  let progress = 0;
  const eq = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

  return {
    push(key: string): boolean {
      if (eq(key, sequence[progress])) {
        progress += 1;
        if (progress === sequence.length) {
          progress = 0;
          return true;
        }
        return false;
      }
      // mismatch: restart, but re-count if this key is the first symbol
      progress = eq(key, sequence[0]) ? 1 : 0;
      return false;
    },
    reset() {
      progress = 0;
    },
  };
}
