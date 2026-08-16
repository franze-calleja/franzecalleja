/**
 * Centralized site domain configuration.
 * Defaults to the active live production URL (https://franzecalleja.vercel.app)
 * and automatically respects NEXT_PUBLIC_SITE_URL if you attach a custom .dev or .com domain in the future.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://franzecalleja.vercel.app");
