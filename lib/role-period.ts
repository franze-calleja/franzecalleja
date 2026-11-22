export type RoleSpan = { start: number; end: number; ongoing: boolean };

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

type Point = { month: number | null; year: number | null };

function parsePoint(text: string): Point {
  const lower = text.toLowerCase();
  const month = MONTHS.findIndex((name) => new RegExp(`\\b${name}`).test(lower));
  const year = /\b(?:19|20)\d{2}\b/.exec(lower)?.[0];
  return { month: month >= 0 ? month : null, year: year ? Number(year) : null };
}

/**
 * Places a role period such as "August 2025 - Present", "February - May 2025"
 * or "2023 - Present" on a fractional-year axis: the start is the start of its
 * month, the end the end of its month ("Present" = the current month). A side
 * without a year borrows the other side's; a bare year starts in January.
 */
export function parseRolePeriod(period: string, now: Date): RoleSpan | null {
  const [from = "", to = ""] = period.split(/\s+[-–—]\s+/);
  const ongoing = /present|now|current/i.test(to);
  const start = parsePoint(from);
  const end = ongoing ? { month: now.getMonth(), year: now.getFullYear() } : parsePoint(to);

  const startYear = start.year ?? end.year;
  const endYear = end.year ?? start.year;
  if (startYear === null || endYear === null) return null;

  return {
    start: startYear + (start.month ?? 0) / 12,
    end: endYear + ((end.month ?? 11) + 1) / 12,
    ongoing,
  };
}

/** Whole years for the ruler: from the earliest start to the year after the latest end. */
export function rulerYears(spans: Array<{ start: number; end: number }>): number[] {
  if (spans.length === 0) return [];
  const first = Math.floor(Math.min(...spans.map((s) => s.start)));
  const last = Math.floor(Math.max(...spans.map((s) => s.end))) + 1;
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}
