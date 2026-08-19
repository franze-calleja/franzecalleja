import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Counts the cases Vitest will run, by scanning the suite source.
 *
 * The /stats tile this feeds is prerendered, so the scan runs once during
 * `next build` and the total is baked into the HTML — never at request time.
 * Deriving it is the whole point: it replaced a hardcoded commit count that
 * had quietly drifted thousands of commits out of date.
 */
const SUITE_DIR = "lib";
const TEST_FILE = /\.test\.ts$/;

/** Matches `it(`, `test(`, and modifiers like `it.each(` at the start of a line. */
const TEST_CASE = /^\s*(?:it|test)(?:\.\w+)*\s*\(/gm;

export function countTestCases(dir: string = SUITE_DIR): number {
  const root = join(process.cwd(), dir);

  return readdirSync(root)
    .filter((entry) => TEST_FILE.test(entry))
    .reduce((total, entry) => {
      const source = readFileSync(join(root, entry), "utf8");
      return total + (source.match(TEST_CASE)?.length ?? 0);
    }, 0);
}
