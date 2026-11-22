import { ViewTransition } from "react";

/**
 * Templates remount on every navigation, so wrapping pages here lets React
 * animate the outgoing and incoming page (see the `page` view-transition
 * rules in globals.css). Requires `experimental.viewTransition`.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <ViewTransition name="page">{children}</ViewTransition>;
}
