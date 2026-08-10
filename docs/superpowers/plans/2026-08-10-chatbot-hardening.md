# Chatbot Hardening + Streaming Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portfolio chat assistant answer from all of its content, stream its replies, and stop being a cost/abuse liability.

**Architecture:** Extract two pure modules out of the API route — a denylist-based portfolio context builder and a conversation validator — then rewrite `app/api/chat/route.ts` to use them with header auth, a time-to-first-token timeout, and a unified local-fallback path. Finally switch to Gemini's SSE streaming endpoint, parsed by a third pure module, with the client reading the stream.

**Tech Stack:** Next.js 16.1.7 (App Router), React 19.2.3, TypeScript 5, Vitest 4.1.8, Gemini REST API v1beta.

**Spec:** `docs/superpowers/specs/2026-08-10-chatbot-hardening-design.md`

**Branch:** `chatbot-hardening` (already created off `main`)

## Global Constraints

- **Files in `lib/` MUST use relative imports**, never the `@/*` alias. There is no `vitest.config.ts`, so Vitest cannot resolve `@/*` from `tsconfig.json` — an aliased import in `lib/` breaks `npm test`. Files in `app/` may use `@/*` (Next.js resolves it; those files are not under test).
- **Do not add `vitest.config.ts`** or any Vitest setup file. The suite is zero-config.
- Tests are colocated in `lib/` next to the module under test, named `<module>.test.ts`, importing `{ describe, it, expect }` from `"vitest"` — matching `lib/konami.test.ts` and `lib/multi-click.test.ts`.
- **Do not upgrade or add dependencies.** Every task uses what is already installed.
- Limits, copied verbatim from the spec: **2,000** chars per message, **8,000** chars per conversation, **10** messages retained, **15,000** ms timeout, **512** max output tokens.
- Excluded context keys are exactly `gallery` and `footer`.
- `npm test` must pass at the end of every task, including the 11 pre-existing tests.
- Do not modify `lib/rate-limit.ts`, `lib/konami.ts`, `lib/multi-click.ts`, or `app/profile-data.json`.

---

### Task 1: Portfolio context builder

Replaces the hand-maintained allowlist in `route.ts:124-133` that silently drops `skills` and `links`.

**Files:**
- Create: `lib/chat-context.ts`
- Test: `lib/chat-context.test.ts`

**Interfaces:**
- Consumes: `app/profile-data.json` (relative import)
- Produces:
  - `portfolioContext: PortfolioContext` — typed object, consumed by Task 4's `buildLocalReply`
  - `portfolioContextJson: string` — serialized once, consumed by Task 4's system instruction
  - `type PortfolioContext = Omit<typeof content, "gallery" | "footer">`

- [ ] **Step 1: Write the failing test**

Create `lib/chat-context.test.ts`:

```ts
import { describe, it, expect } from "vitest";

import { portfolioContext, portfolioContextJson } from "./chat-context";

describe("portfolioContext", () => {
  it("includes every content key the assistant answers from", () => {
    const expectedKeys = [
      "profile",
      "links",
      "about",
      "experience",
      "techstack",
      "skills",
      "projects",
      "education",
      "testimonials",
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
    expect(portfolioContext).not.toHaveProperty("gallery");
    expect(portfolioContext).not.toHaveProperty("footer");
  });
});

describe("portfolioContextJson", () => {
  it("round-trips to the same object", () => {
    expect(JSON.parse(portfolioContextJson)).toEqual(portfolioContext);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/chat-context.test.ts`
Expected: FAIL — `Failed to resolve import "./chat-context"`

- [ ] **Step 3: Write the implementation**

Create `lib/chat-context.ts`:

```ts
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/chat-context.test.ts`
Expected: PASS — 5 tests

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — 16 tests across 3 files (11 pre-existing + 5 new)

- [ ] **Step 6: Commit**

```bash
git add lib/chat-context.ts lib/chat-context.test.ts
git commit -m "feat: build assistant context from a denylist so skills and links reach the model"
```

---

### Task 2: Conversation validation

Bounds input size. `route.ts:116-122` caps message *count* but never *length*, so ten 200KB messages pass and are billed as input tokens.

**Files:**
- Create: `lib/chat-validation.ts`
- Test: `lib/chat-validation.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `normalizeConversation(messages: unknown): NormalizeResult`
  - `type GeminiContent = { role: "user" | "model"; parts: Array<{ text: string }> }`
  - `type NormalizeResult = { ok: true; conversation: GeminiContent[]; lastUserMessage: string } | { ok: false; error: string }`
  - Constants `MAX_MESSAGE_CHARS`, `MAX_CONVERSATION_CHARS`, `MAX_MESSAGES`
  - All consumed by Task 4's route.

- [ ] **Step 1: Write the failing test**

Create `lib/chat-validation.test.ts`:

```ts
import { describe, it, expect } from "vitest";

import {
  MAX_CONVERSATION_CHARS,
  MAX_MESSAGE_CHARS,
  normalizeConversation,
} from "./chat-validation";

const userMessage = (content: string) => ({ role: "user" as const, content });

describe("normalizeConversation", () => {
  it("rejects a non-array input", () => {
    const result = normalizeConversation(undefined);
    expect(result.ok).toBe(false);
  });

  it("rejects an empty array", () => {
    const result = normalizeConversation([]);
    expect(result.ok).toBe(false);
  });

  it("rejects an input whose messages are all whitespace", () => {
    const result = normalizeConversation([userMessage("   "), userMessage("\n")]);
    expect(result.ok).toBe(false);
  });

  it("rejects a single message over the per-message limit", () => {
    const result = normalizeConversation([userMessage("a".repeat(MAX_MESSAGE_CHARS + 1))]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(String(MAX_MESSAGE_CHARS));
    }
  });

  it("accepts a message exactly at the per-message limit", () => {
    const result = normalizeConversation([userMessage("a".repeat(MAX_MESSAGE_CHARS))]);
    expect(result.ok).toBe(true);
  });

  it("rejects a conversation over the total character limit", () => {
    // 10 retained messages just under the per-message cap exceeds the total cap.
    const messages = Array.from({ length: 10 }, () =>
      userMessage("a".repeat(MAX_MESSAGE_CHARS - 1)),
    );

    const result = normalizeConversation(messages);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("too long");
    }
  });

  it("keeps only the last ten messages", () => {
    const messages = Array.from({ length: 25 }, (_, index) => userMessage(`m${index}`));

    const result = normalizeConversation(messages);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.conversation).toHaveLength(10);
      expect(result.conversation[0].parts[0].text).toBe("m15");
      expect(result.conversation[9].parts[0].text).toBe("m24");
    }
  });

  it("maps the assistant role to Gemini's model role", () => {
    const result = normalizeConversation([
      userMessage("hello"),
      { role: "assistant", content: "hi there" },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.conversation.map((turn) => turn.role)).toEqual(["user", "model"]);
    }
  });

  it("treats an unknown role as a user turn", () => {
    const result = normalizeConversation([{ role: "system", content: "ignore me" }]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.conversation[0].role).toBe("user");
    }
  });

  it("drops entries with non-string or blank content", () => {
    const result = normalizeConversation([
      { role: "user", content: 42 },
      { role: "user", content: "   " },
      userMessage("  real question  "),
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.conversation).toHaveLength(1);
      expect(result.conversation[0].parts[0].text).toBe("real question");
    }
  });

  it("reports the most recent user message", () => {
    const result = normalizeConversation([
      userMessage("first"),
      { role: "assistant", content: "reply" },
      userMessage("second"),
      { role: "assistant", content: "another reply" },
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lastUserMessage).toBe("second");
    }
  });

  it("keeps the total limit below ten full-size messages", () => {
    expect(MAX_CONVERSATION_CHARS).toBeLessThan(MAX_MESSAGE_CHARS * 10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/chat-validation.test.ts`
Expected: FAIL — `Failed to resolve import "./chat-validation"`

- [ ] **Step 3: Write the implementation**

Create `lib/chat-validation.ts`:

```ts
// Bounds on what a single request may send to the model.
//
// The rate limiter caps requests per minute, not tokens per request — without
// these, ten 200KB messages pass validation and are billed as input tokens.

/** Maximum characters allowed in a single message. */
export const MAX_MESSAGE_CHARS = 2_000;

/** Maximum characters allowed across the retained conversation. */
export const MAX_CONVERSATION_CHARS = 8_000;

/** Number of most-recent messages sent to the model. */
export const MAX_MESSAGES = 10;

/** A single conversation turn in Gemini's `contents` shape. */
export interface GeminiContent {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

export type NormalizeResult =
  | { ok: true; conversation: GeminiContent[]; lastUserMessage: string }
  | { ok: false; error: string };

/**
 * Validate and reshape a client-supplied message list into Gemini's format.
 *
 * Oversized input is rejected rather than truncated: a silently shortened
 * question produces a confidently wrong answer, which is worse than an error.
 *
 * @param messages  Untrusted value straight off the request body.
 */
export function normalizeConversation(messages: unknown): NormalizeResult {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: "No messages were provided." };
  }

  const turns: Array<{ role: "user" | "model"; text: string }> = [];

  for (const message of messages) {
    const content = (message as { content?: unknown })?.content;

    if (typeof content !== "string") {
      continue;
    }

    const text = content.trim();

    if (!text) {
      continue;
    }

    if (text.length > MAX_MESSAGE_CHARS) {
      return {
        ok: false,
        error: `Messages are limited to ${MAX_MESSAGE_CHARS} characters. Please shorten your question.`,
      };
    }

    const role = (message as { role?: unknown })?.role;
    turns.push({ role: role === "assistant" ? "model" : "user", text });
  }

  if (turns.length === 0) {
    return { ok: false, error: "No messages were provided." };
  }

  const recent = turns.slice(-MAX_MESSAGES);
  const totalChars = recent.reduce((total, turn) => total + turn.text.length, 0);

  if (totalChars > MAX_CONVERSATION_CHARS) {
    return {
      ok: false,
      error: "This conversation is too long. Please start a new one.",
    };
  }

  const lastUserMessage =
    [...recent].reverse().find((turn) => turn.role === "user")?.text ?? "";

  return {
    ok: true,
    conversation: recent.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    lastUserMessage,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/chat-validation.test.ts`
Expected: PASS — 12 tests

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — 28 tests across 4 files

- [ ] **Step 6: Commit**

```bash
git add lib/chat-validation.ts lib/chat-validation.test.ts
git commit -m "feat: bound chat input size per message and per conversation"
```

---

### Task 3: Rate limiter test coverage

`lib/rate-limit.ts` guards the endpoint but has no tests. **No production code changes in this task** — tests only.

**Files:**
- Test: `lib/rate-limit.test.ts`

**Interfaces:**
- Consumes: `checkRateLimit(ip: string): RateLimitResult` from `./rate-limit` (already exists, unchanged)
- Produces: nothing

- [ ] **Step 1: Write the test**

Create `lib/rate-limit.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from "vitest";

import { checkRateLimit } from "./rate-limit";

// rate-limit.ts holds one module-level Map, so hits persist across tests in this
// file. Every test takes a fresh IP to stay isolated from its neighbours.
let ipCounter = 0;
const nextIp = () => `10.0.0.${ipCounter++}`;

afterEach(() => {
  vi.useRealTimers();
});

describe("checkRateLimit", () => {
  it("allows ten requests in a window and counts remaining down to zero", () => {
    const ip = nextIp();

    const results = Array.from({ length: 10 }, () => checkRateLimit(ip));

    expect(results.every((result) => result.allowed)).toBe(true);
    expect(results.map((result) => result.remaining)).toEqual([
      9, 8, 7, 6, 5, 4, 3, 2, 1, 0,
    ]);
  });

  it("denies the eleventh request inside the same window", () => {
    const ip = nextIp();

    for (let i = 0; i < 10; i += 1) {
      checkRateLimit(ip);
    }

    const denied = checkRateLimit(ip);

    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.resetInSeconds).toBeGreaterThan(0);
    expect(denied.resetInSeconds).toBeLessThanOrEqual(60);
  });

  it("allows requests again once the window has elapsed", () => {
    vi.useFakeTimers();
    const ip = nextIp();

    for (let i = 0; i < 10; i += 1) {
      checkRateLimit(ip);
    }

    expect(checkRateLimit(ip).allowed).toBe(false);

    vi.advanceTimersByTime(60_001);

    const afterWindow = checkRateLimit(ip);

    expect(afterWindow.allowed).toBe(true);
    expect(afterWindow.remaining).toBe(9);
  });

  it("tracks each IP independently", () => {
    const busy = nextIp();
    const quiet = nextIp();

    for (let i = 0; i < 10; i += 1) {
      checkRateLimit(busy);
    }

    expect(checkRateLimit(busy).allowed).toBe(false);
    expect(checkRateLimit(quiet).allowed).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npx vitest run lib/rate-limit.test.ts`
Expected: PASS — 4 tests. These describe existing correct behaviour, so they pass immediately; that is the point of a characterisation test.

- [ ] **Step 3: Verify the test can actually fail**

Temporarily change `MAX_REQUESTS` in `lib/rate-limit.ts` from `10` to `5`, then run:

Run: `npx vitest run lib/rate-limit.test.ts`
Expected: FAIL — the first two tests fail.

**Now revert `MAX_REQUESTS` back to `10`** and re-run:

Run: `npx vitest run lib/rate-limit.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 4: Confirm rate-limit.ts is unmodified**

Run: `git diff --exit-code lib/rate-limit.ts`
Expected: no output, exit code 0. If this prints a diff, the Step 3 revert was incomplete — restore with `git checkout lib/rate-limit.ts`.

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — 32 tests across 5 files

- [ ] **Step 6: Commit**

```bash
git add lib/rate-limit.test.ts
git commit -m "test: cover rate limiter windowing, denial, and per-IP isolation"
```

---

### Task 4: Harden the route (still non-streaming)

Wires in Tasks 1 and 2, adds header auth, a timeout, an output cap, and a unified fallback. Streaming comes in Task 6 — keeping them separate means this task is independently shippable and reviewable.

**Files:**
- Modify: `app/api/chat/route.ts` (full rewrite)

**Interfaces:**
- Consumes: `portfolioContext`, `portfolioContextJson`, `PortfolioContext` (Task 1); `normalizeConversation` (Task 2); `checkRateLimit` (existing)
- Produces: JSON responses only. Task 6 replaces the success path with a stream.

- [ ] **Step 1: Rewrite the route**

Replace the entire contents of `app/api/chat/route.ts`:

```ts
import { NextResponse } from "next/server";

import {
  portfolioContext,
  portfolioContextJson,
  type PortfolioContext,
} from "@/lib/chat-context";
import { normalizeConversation } from "@/lib/chat-validation";
import { checkRateLimit } from "@/lib/rate-limit";

/** How long to wait for Gemini before answering from local data instead. */
const GEMINI_TIMEOUT_MS = 15_000;

/** Upper bound on generated response length, to keep per-request cost bounded. */
const MAX_OUTPUT_TOKENS = 512;

/** Built once — the portfolio data is static for the life of the process. */
const SYSTEM_INSTRUCTION = [
  "You are a concise, helpful assistant for Franze William Calleja's personal portfolio.",
  "Answer questions using only the portfolio context provided below.",
  "If the answer is not in the context, say you do not have that information.",
  "Keep responses short, natural, and factual.",
  `Portfolio context: ${portfolioContextJson}`,
].join("\n\n");

function buildLocalReply(question: string, context: PortfolioContext) {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes("project") || normalizedQuestion.includes("work")) {
    const projectNames = context.projects.items
      .slice(0, 4)
      .map((project) => project.name)
      .join(", ");

    return `Recent projects include ${projectNames}. I can also share the technologies used on each one.`;
  }

  if (
    normalizedQuestion.includes("tech") ||
    normalizedQuestion.includes("stack") ||
    normalizedQuestion.includes("tools")
  ) {
    const techLabels = context.techstack.items
      .slice(0, 6)
      .map((tech) => tech.label)
      .join(", ");

    return `Franze works mainly with ${techLabels}, along with backend tools like Prisma, MySQL, PostgreSQL, Docker, and Git.`;
  }

  if (
    normalizedQuestion.includes("experience") ||
    normalizedQuestion.includes("job") ||
    normalizedQuestion.includes("role")
  ) {
    const firstRoles = context.experience.steps
      .slice(0, 3)
      .map((step) => `${step.title} at ${step.caption}`)
      .join("; ");

    return `He has experience as ${firstRoles}.`;
  }

  if (
    normalizedQuestion.includes("education") ||
    normalizedQuestion.includes("school") ||
    normalizedQuestion.includes("college")
  ) {
    const education = context.education.items[0];

    return `${education.degree} at ${education.institution} (${education.year}), with honors: ${education.honors}.`;
  }

  if (
    normalizedQuestion.includes("available") ||
    normalizedQuestion.includes("contact") ||
    normalizedQuestion.includes("hire")
  ) {
    return `${context.availability.status}. ${context.availability.description}`;
  }

  if (
    normalizedQuestion.includes("about") ||
    normalizedQuestion.includes("who are you") ||
    normalizedQuestion.includes("tell me about")
  ) {
    return context.about.title;
  }

  return `I may not have a live Gemini response right now, but I can still help with Franze's profile, projects, experience, tech stack, education, and availability.`;
}

/** Answer from local portfolio data when Gemini is unavailable. */
function localFallbackResponse(lastUserMessage: string, warning: string) {
  return NextResponse.json({
    reply: buildLocalReply(lastUserMessage, portfolioContext),
    model: "local-fallback",
    warning,
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-3-flash-preview";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing GEMINI_API_KEY in your environment." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    messages?: unknown;
  } | null;

  const normalized = normalizeConversation(body?.messages);

  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const { allowed, remaining, resetInSeconds } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      {
        error: `You've sent too many messages. Please wait ${resetInSeconds} second${resetInSeconds === 1 ? "" : "s"} before trying again.`,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(resetInSeconds),
        },
      },
    );
  }

  const requestBody = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: normalized.conversation,
    generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
  };

  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(GEMINI_TIMEOUT_MS),
      },
    );
  } catch (error) {
    // Timeout or network failure — same degraded mode as a 5xx.
    console.error("[chat] Gemini request did not complete:", error);

    return localFallbackResponse(
      normalized.lastUserMessage,
      "The assistant took too long to respond, so this answer comes from local portfolio data.",
    );
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => "<unreadable>");
    console.error(`[chat] Gemini returned ${response.status}:`, errorText);

    if (response.status === 429 || response.status >= 500) {
      return localFallbackResponse(
        normalized.lastUserMessage,
        response.status === 429
          ? "Gemini quota is exhausted, so the assistant is answering from local portfolio data."
          : "Gemini is unavailable, so the assistant is answering from local portfolio data.",
      );
    }

    return NextResponse.json(
      { error: "The assistant could not answer that right now." },
      { status: 502 },
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const reply = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!reply) {
    console.error("[chat] Gemini returned no text");

    return localFallbackResponse(
      normalized.lastUserMessage,
      "The assistant returned an empty response, so this answer comes from local portfolio data.",
    );
  }

  return NextResponse.json(
    { reply, model: modelName },
    { headers: { "X-RateLimit-Remaining": String(remaining) } },
  );
}
```

- [ ] **Step 2: Typecheck and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no type errors, no lint errors.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: PASS — 32 tests, unchanged from Task 3.

- [ ] **Step 5: Manually verify the skills and contact fix**

Start the dev server with a valid key: `GEMINI_API_KEY=<key> npm run dev`

In the chat widget, ask both:
1. "What are Franze's skills?"
2. "How do I contact him?"

Expected: both answer from the portfolio data. Before this task, both produced "I do not have that information." If either still declines, the context builder is not wired in — check the import in `route.ts`.

- [ ] **Step 6: Manually verify the fallback still works**

Restart with a deliberately invalid key: `GEMINI_API_KEY=invalid-key npm run dev`

Ask "What projects has he worked on?"

Expected: a JSON error bubble, since a bad key returns 400 (not 429/5xx). Now simulate the quota path instead by temporarily changing the `response.status === 429 || response.status >= 500` condition to `true`, re-asking, and confirming a local-fallback answer with a `warning` field appears. **Revert that change before committing.**

Run: `git diff app/api/chat/route.ts | grep -c "status === 429"`
Expected: confirms the original condition is restored before you commit.

- [ ] **Step 7: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat: harden chat route with timeout, header auth, output cap, and unified fallback"
```

---

### Task 5: Gemini SSE parser

Gemini's `alt=sse` body arrives as `data: {...}` lines that split arbitrarily across network chunks. Extracting this into a pure module keeps Task 6's route thin and makes the partial-line handling testable without a network.

**Files:**
- Create: `lib/gemini-stream.ts`
- Test: `lib/gemini-stream.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `createSseTextParser(): { push(chunk: string): string[] }` — consumed by Task 6

- [ ] **Step 1: Write the failing test**

Create `lib/gemini-stream.test.ts`:

```ts
import { describe, it, expect } from "vitest";

import { createSseTextParser } from "./gemini-stream";

const sseLine = (text: string) =>
  `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;

describe("createSseTextParser", () => {
  it("extracts text from a complete data line", () => {
    const parser = createSseTextParser();

    expect(parser.push(sseLine("Hello"))).toEqual(["Hello"]);
  });

  it("extracts text from several lines in one chunk", () => {
    const parser = createSseTextParser();

    expect(parser.push(sseLine("Hello") + sseLine(" world"))).toEqual([
      "Hello",
      " world",
    ]);
  });

  it("buffers a line split across two chunks", () => {
    const parser = createSseTextParser();
    const line = sseLine("Hello");
    const splitAt = Math.floor(line.length / 2);

    expect(parser.push(line.slice(0, splitAt))).toEqual([]);
    expect(parser.push(line.slice(splitAt))).toEqual(["Hello"]);
  });

  it("joins multiple parts within one candidate", () => {
    const parser = createSseTextParser();
    const payload = JSON.stringify({
      candidates: [{ content: { parts: [{ text: "one " }, { text: "two" }] } }],
    });

    expect(parser.push(`data: ${payload}\n\n`)).toEqual(["one two"]);
  });

  it("ignores non-data lines, blank lines, and the DONE sentinel", () => {
    const parser = createSseTextParser();

    expect(parser.push(`: comment\n\ndata: [DONE]\n\n`)).toEqual([]);
  });

  it("skips malformed JSON instead of throwing", () => {
    const parser = createSseTextParser();

    expect(() => parser.push("data: {not json}\n\n")).not.toThrow();
    expect(parser.push(sseLine("still works"))).toEqual(["still works"]);
  });

  it("skips chunks that carry no text", () => {
    const parser = createSseTextParser();
    const payload = JSON.stringify({ candidates: [{ finishReason: "STOP" }] });

    expect(parser.push(`data: ${payload}\n\n`)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/gemini-stream.test.ts`
Expected: FAIL — `Failed to resolve import "./gemini-stream"`

- [ ] **Step 3: Write the implementation**

Create `lib/gemini-stream.ts`:

```ts
// Incremental parser for Gemini's `alt=sse` response body.
//
// The body is a sequence of `data: {...}` lines, but network chunks split at
// arbitrary byte offsets — a single line routinely arrives in two pieces. The
// parser holds the trailing partial line until the rest of it turns up.

interface GeminiStreamChunk {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export interface SseTextParser {
  /** Feed a decoded chunk; returns any complete text deltas it contained. */
  push(chunk: string): string[];
}

export function createSseTextParser(): SseTextParser {
  let buffer = "";

  return {
    push(chunk: string): string[] {
      buffer += chunk;

      const lines = buffer.split("\n");
      // The final element is either empty or an incomplete line — hold it back.
      buffer = lines.pop() ?? "";

      const texts: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed.startsWith("data:")) {
          continue;
        }

        const payload = trimmed.slice("data:".length).trim();

        if (!payload || payload === "[DONE]") {
          continue;
        }

        let parsed: GeminiStreamChunk;

        try {
          parsed = JSON.parse(payload) as GeminiStreamChunk;
        } catch {
          // A malformed line should not kill an otherwise healthy stream.
          continue;
        }

        const text = parsed.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("");

        if (text) {
          texts.push(text);
        }
      }

      return texts;
    },
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/gemini-stream.test.ts`
Expected: PASS — 7 tests

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — 39 tests across 6 files

- [ ] **Step 6: Commit**

```bash
git add lib/gemini-stream.ts lib/gemini-stream.test.ts
git commit -m "feat: add incremental parser for Gemini SSE responses"
```

---

### Task 6: Stream responses end to end

Switches the route to `streamGenerateContent` and teaches the client to read a stream.

**Two details that matter:**

1. **The timeout becomes a manual `AbortController`, not `AbortSignal.timeout`.** An `AbortSignal.timeout(15_000)` covers the *entire* request including body transfer, so it would abort a healthy stream 15 seconds into generation. The controller is cleared once the first token arrives, making the timeout guard time-to-first-token instead.
2. **The stream is not committed until the first chunk parses.** Once bytes are written under a `200`, the response cannot switch to a JSON error — so all pre-first-token failures (quota, timeout, bad key) still take the Task 4 JSON fallback path unchanged.

**Files:**
- Modify: `app/api/chat/route.ts:169-...` (replace everything from the `fetch` call to the end of `POST`)
- Modify: `components/chat-assistant.tsx:30-118` (state + `sendMessage`), `chat-assistant.tsx:174` (message key), `chat-assistant.tsx:184` (thinking bubble)

**Interfaces:**
- Consumes: `createSseTextParser` (Task 5); everything from Task 4
- Produces: route returns either `application/json` (error/fallback) or `text/plain; charset=utf-8` (stream)

- [ ] **Step 1: Add the parser import to the route**

In `app/api/chat/route.ts`, add below the existing `chat-validation` import:

```ts
import { createSseTextParser } from "@/lib/gemini-stream";
```

- [ ] **Step 2: Replace the fetch and response handling**

In `app/api/chat/route.ts`, replace everything from `let response: Response;` through the end of the `POST` function with:

```ts
  // A manual controller rather than AbortSignal.timeout: the timeout must guard
  // time-to-first-token, not total generation time. AbortSignal.timeout would
  // cut off a healthy stream mid-answer.
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), GEMINI_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(requestBody),
        signal: abortController.signal,
      },
    );
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[chat] Gemini request did not complete:", error);

    return localFallbackResponse(
      normalized.lastUserMessage,
      "The assistant took too long to respond, so this answer comes from local portfolio data.",
    );
  }

  if (!response.ok) {
    clearTimeout(timeoutId);

    const errorText = await response.text().catch(() => "<unreadable>");
    console.error(`[chat] Gemini returned ${response.status}:`, errorText);

    if (response.status === 429 || response.status >= 500) {
      return localFallbackResponse(
        normalized.lastUserMessage,
        response.status === 429
          ? "Gemini quota is exhausted, so the assistant is answering from local portfolio data."
          : "Gemini is unavailable, so the assistant is answering from local portfolio data.",
      );
    }

    return NextResponse.json(
      { error: "The assistant could not answer that right now." },
      { status: 502 },
    );
  }

  const reader = response.body?.getReader();

  if (!reader) {
    clearTimeout(timeoutId);
    console.error("[chat] Gemini response had no body");

    return localFallbackResponse(
      normalized.lastUserMessage,
      "The assistant returned an empty response, so this answer comes from local portfolio data.",
    );
  }

  const decoder = new TextDecoder();
  const parser = createSseTextParser();

  // Pull until the first text delta arrives. Nothing is written to the client
  // yet, so any failure up to this point can still return JSON.
  let firstTexts: string[] = [];

  try {
    while (firstTexts.length === 0) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      firstTexts = parser.push(decoder.decode(value, { stream: true }));
    }
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("[chat] Gemini stream failed before any output:", error);

    return localFallbackResponse(
      normalized.lastUserMessage,
      "The assistant took too long to respond, so this answer comes from local portfolio data.",
    );
  }

  clearTimeout(timeoutId);

  if (firstTexts.length === 0) {
    console.error("[chat] Gemini stream produced no text");

    return localFallbackResponse(
      normalized.lastUserMessage,
      "The assistant returned an empty response, so this answer comes from local portfolio data.",
    );
  }

  // Past this point the response is committed: bytes go out under a 200, so a
  // mid-stream failure can only append a notice, never change the status.
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (const text of firstTexts) {
        controller.enqueue(encoder.encode(text));
      }

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          for (const text of parser.push(decoder.decode(value, { stream: true }))) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (error) {
        console.error("[chat] Gemini stream broke mid-response:", error);
        controller.enqueue(encoder.encode("\n\n(The response was cut short.)"));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-RateLimit-Remaining": String(remaining),
    },
  });
}
```

- [ ] **Step 3: Typecheck the route**

Run: `npx tsc --noEmit`
Expected: no errors. If TypeScript reports unreachable or duplicated code, the old JSON success path was not fully replaced — re-check the boundaries of Step 2.

- [ ] **Step 4: Add streaming state to the client**

In `components/chat-assistant.tsx`, add one state hook after the existing `isSending` declaration (line 34):

```tsx
  const [isStreamingReply, setIsStreamingReply] = useState(false);
```

`isSending` keeps the send button disabled for the whole request; `isStreamingReply` only controls whether the `Thinking...` bubble is still showing.

- [ ] **Step 5: Declare the local streaming flag**

The next step uses `isStreamingReplyStarted`, a plain local variable. React state updates are async, so `isStreamingReply` cannot be read back reliably inside the read loop — a local is the only thing that reflects "have I appended the bubble yet?" synchronously.

In `components/chat-assistant.tsx`, add it immediately before the `try`, just after `setIsSending(true)` (line 79):

```tsx
    let isStreamingReplyStarted = false;
```

- [ ] **Step 6: Replace the response handling in `sendMessage`**

In `components/chat-assistant.tsx`, replace the `try`/`catch`/`finally` block of `sendMessage` (lines 81-117) with:

```tsx
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      // Errors and local fallbacks come back as JSON; live answers stream as text.
      if (!response.ok || contentType.includes("application/json")) {
        const data = (await response.json()) as { reply?: string; error?: string };

        if (!response.ok) {
          throw new Error(data.error ?? "Something went wrong.");
        }

        setMessages((currentMessages) => [
          ...currentMessages,
          {
            role: "assistant",
            content:
              data.reply ?? "I could not generate a response right now. Please try again.",
          },
        ]);

        return;
      }

      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("I could not read the response. Please try again.");
      }

      const decoder = new TextDecoder();
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        assistantText += decoder.decode(value, { stream: true });

        if (!isStreamingReplyStarted) {
          isStreamingReplyStarted = true;
          setIsStreamingReply(true);
          setMessages((currentMessages) => [
            ...currentMessages,
            { role: "assistant", content: assistantText },
          ]);
        } else {
          setMessages((currentMessages) => [
            ...currentMessages.slice(0, -1),
            { role: "assistant", content: assistantText },
          ]);
        }
      }
    } catch (error) {
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "I could not connect to the assistant right now.",
        },
      ]);
    } finally {
      setIsSending(false);
      setIsStreamingReply(false);
    }
```

- [ ] **Step 7: Dismiss the thinking bubble on first token**

In `components/chat-assistant.tsx`, change the thinking-bubble condition (line 184) from:

```tsx
              {isSending ? (
```

to:

```tsx
              {isSending && !isStreamingReply ? (
```

- [ ] **Step 8: Make the message key stable during streaming**

The current key includes the message text, so every streamed chunk changes the last message's key and React remounts the bubble on each token — causing visible flicker. Change line 174 from:

```tsx
                  key={`${message.role}-${index}-${message.content.slice(0, 12)}`}
```

to:

```tsx
                  key={`${message.role}-${index}`}
```

Messages are only ever appended or replaced in place, so the index is stable.

- [ ] **Step 9: Typecheck, lint, and build**

Run: `npx tsc --noEmit && npm run lint && npm run build`
Expected: all three succeed.

- [ ] **Step 10: Run the full suite**

Run: `npm test`
Expected: PASS — 39 tests, unchanged from Task 5.

- [ ] **Step 11: Manually verify streaming**

Run: `GEMINI_API_KEY=<key> npm run dev`

Ask "Tell me about Franze's experience."

Expected:
- `Thinking...` appears, then disappears as soon as the first words arrive
- text builds up progressively rather than appearing all at once
- the bubble does not flicker or jump as it grows
- the send button stays disabled until the reply completes

- [ ] **Step 12: Manually verify the fallback survived**

Run: `GEMINI_API_KEY=invalid-key npm run dev`

Ask anything. Expected: a clean error bubble, not a blank message or a hang. Then temporarily force the fallback by changing `response.status === 429 || response.status >= 500` to `true`, re-ask, and confirm a local-fallback answer arrives as JSON. **Revert before committing.**

- [ ] **Step 13: Commit**

```bash
git add app/api/chat/route.ts components/chat-assistant.tsx
git commit -m "feat: stream assistant replies from Gemini SSE endpoint"
```

---

## Final Verification

- [ ] `npm test` — 39 tests across 6 files, all passing
- [ ] `npm run lint` — clean
- [ ] `npm run build` — succeeds
- [ ] `git diff main --stat` — touches only the 7 files in the spec's file table plus `lib/gemini-stream.ts` and its test
- [ ] `grep -rn "@/" lib/` returns nothing — no aliased imports in `lib/`
- [ ] `grep -n "key=\${apiKey}" app/api/chat/route.ts` returns nothing — the key is no longer in a URL
- [ ] Spec's manual checks pass: "What are Franze's skills?" and "How do I contact him?" both answer from context; replies stream progressively; an invalid key still yields a usable response

## Deviations from the spec

1. **Added `lib/gemini-stream.ts` + test** (not in the spec's file table). SSE parsing needs partial-line buffering, which is worth isolating and testing rather than inlining into the route.
2. **Manual `AbortController` instead of `AbortSignal.timeout(15_000)`.** The spec's form would abort a healthy stream mid-generation, since the signal covers body transfer. The timeout now guards time-to-first-token.
3. **Message `key` in `chat-assistant.tsx` changed to be content-independent.** Not called out in the spec, but content-derived keys remount the bubble on every streamed token.
4. **Empty-reply case now falls back to local data** rather than returning the spec's HTTP 502. Consistent with treating every Gemini failure mode through one degraded path.
