import content from "../app/profile-data.json";

/**
 * Top-level keys in profile-data.json that are presentation-only — CSS gradient
 * strings, image paths, nav hrefs — and carry nothing a visitor would ask about.
 *
 * This is a denylist on purpose. The allowlist it replaced silently dropped any
 * key added to profile-data.json later, which is exactly how `skills` and
 * `links` went missing from the model's context.
 */
const EXCLUDED_KEYS = ["gallery", "footer"] as const;

type ExcludedKey = (typeof EXCLUDED_KEYS)[number];

export type PortfolioContext = Omit<typeof content, ExcludedKey>;

function buildPortfolioContext(): PortfolioContext {
  const excluded = new Set<string>(EXCLUDED_KEYS);

  return Object.fromEntries(
    Object.entries(content).filter(([key]) => !excluded.has(key)),
  ) as PortfolioContext;
}

/** The portfolio data the assistant is allowed to see, as a typed object. */
export const portfolioContext: PortfolioContext = buildPortfolioContext();

/**
 * The same data serialized once at module scope. The route embeds this in its
 * system instruction on every request, so it must not be re-stringified per call.
 */
export const portfolioContextJson: string = JSON.stringify(portfolioContext);
