export type StatValue = { prefix: string; number: number; suffix: string; pad: number };

/**
 * Splits a display value like "28+", "05" or "100%" into the integer the
 * count-up animates and the text around it. The prefix may only be symbols
 * (e.g. "$"), so values that start with words ("LeBron James #1") are not
 * treated as numbers. `pad` is the zero-padded width ("05" → 2), else 0.
 */
export function parseStatValue(value: string): StatValue | null {
  const match = /^([^\p{L}\d]*)(\d+)(.*)$/u.exec(value);
  if (!match) return null;
  const [, prefix, digits, suffix] = match;
  return {
    prefix,
    number: Number(digits),
    suffix,
    pad: digits.length > 1 && digits.startsWith("0") ? digits.length : 0,
  };
}
