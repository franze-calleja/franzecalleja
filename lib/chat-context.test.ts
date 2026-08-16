import { describe, it, expect } from "vitest";

import { portfolioContext, portfolioContextJson } from "./chat-context";

describe("portfolioContext", () => {
  it("includes every content key the assistant answers from", () => {
    const expectedKeys = [
      "profile",
      "links",
      "about",
      "interests",
      "experience",
      "techstack",
      "skills",
      "projects",
      "education",
      "availability",
    ];

    for (const key of expectedKeys) {
      expect(portfolioContext).toHaveProperty(key);
    }
  });

  it("includes skills, so specialisation questions are answerable", () => {
    expect(portfolioContext.skills.categories.length).toBeGreaterThan(0);
  });

  it("includes links, so contact questions are answerable", () => {
    expect(portfolioContext.links.length).toBeGreaterThan(0);
  });

  it("excludes presentation-only keys", () => {
    expect(portfolioContext).not.toHaveProperty("footer");
  });
});

describe("portfolioContextJson", () => {
  it("round-trips to the same object", () => {
    expect(JSON.parse(portfolioContextJson)).toEqual(portfolioContext);
  });
});
