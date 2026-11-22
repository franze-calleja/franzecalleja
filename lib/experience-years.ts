/**
 * The latest start year across role periods such as "August 2025 - January
 * 2026" or "February - May 2025": the first four-digit year in each period is
 * its start. Returns null when no period names a year.
 */
export function latestStartYear(periods: string[]): number | null {
  const years = periods
    .map((period) => /\b(?:19|20)\d{2}\b/.exec(period)?.[0])
    .filter((year): year is string => year !== undefined)
    .map(Number);
  return years.length ? Math.max(...years) : null;
}
