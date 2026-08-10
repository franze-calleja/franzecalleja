# Portfolio Chatbot: Hardening + Streaming

**Date:** 2026-08-10
**Branch:** `chatbot-hardening`
**Status:** Approved

## Context

The portfolio ships a Gemini-backed chat assistant: `components/chat-assistant.tsx` posts to
`app/api/chat/route.ts`, which rate-limits by IP (`lib/rate-limit.ts`), stuffs
`app/profile-data.json` into a system instruction, and calls Gemini's REST
`generateContent`. A keyword-matching `buildLocalReply()` answers from local data when Gemini
returns 429 or 5xx.

The trigger for this work was a question about adding RAG. That was investigated and
**explicitly rejected** — see [Rejected: RAG](#rejected-rag). The real defects are elsewhere,
and this spec addresses those.

## Goals

1. The assistant can answer questions about every piece of content in `profile-data.json`.
2. Replies stream instead of arriving as one block after a `Thinking...` placeholder.
3. The endpoint is not a cost or abuse liability.
4. The logic most likely to regress gains test coverage, matching the repo's existing suite.

## Non-goals

- Retrieval, embeddings, or a vector store.
- Persisting conversations, auth, or multi-user session state.
- Replacing the in-memory rate limiter with Redis. The current trade-off is documented and
  correct for a personal portfolio.
- Redesigning the chat UI. Streaming changes how text arrives, not how the widget looks.

## Findings this addresses

| # | Finding | Location |
|---|---|---|
| 1 | `skills` and `links` never reach the model | `route.ts:124-133` |
| 2 | No cap on incoming message size | `route.ts:116-122` |
| 3 | No request timeout | `route.ts:158` |
| 4 | API key passed in URL query string | `route.ts:159` |
| 5 | Raw Gemini error text returned to client | `route.ts:204,209` |
| 6 | No `generationConfig` / `maxOutputTokens` | `route.ts:135-150` |
| 7 | No streaming | `route.ts:158`, `chat-assistant.tsx:82-103` |
| 8 | `JSON.stringify` of static data re-runs per request | `route.ts:144` |

## Design

### 1. Context selection: invert the allowlist

`PortfolioContext` is a hand-maintained allowlist naming 8 of the file's 12 top-level keys.
`skills` (1,118 chars, with per-category proficiency levels) and `links` (email, GitHub,
LinkedIn) are silently omitted. Because the system instruction tells the model to say it lacks
information when the context does not cover a question, the bot actively declines questions it
holds the data for — including its own suggested prompt, "What does Franze specialize in?".

The allowlist is the defect: it drifts every time `profile-data.json` gains a key.

Replace it with a denylist of presentation-only keys in a new `lib/chat-context.ts`:

```ts
const EXCLUDED_KEYS = ["gallery", "footer"] as const;
```

`gallery` holds Tailwind gradient strings and image paths; `footer` holds nav hrefs. Neither
carries information a visitor would ask about, and `gallery.tone` values are pure noise in a
prompt. Everything else is included, so new keys reach the model automatically and this class
of bug cannot recur.

The module exports two values, both computed once at module scope (which also resolves
finding #8):

- `portfolioContext` — the typed object, for `buildLocalReply()`
- `portfolioContextJson` — the serialized string, for the system instruction

**Import constraint:** `lib/chat-context.ts` must import the JSON **relatively**
(`../app/profile-data.json`), not via `@/app/profile-data.json`. The repo has no
`vitest.config.ts`, so Vitest cannot resolve the `@/*` alias declared in `tsconfig.json`; a
`@/` import here would break `npm test`. Every existing module in `lib/` already uses relative
imports, so this matches convention and avoids adding a config file.

### 2. Input validation: `lib/chat-validation.ts`

`.slice(-10)` bounds message *count* but never *length*, so ten 200KB messages pass validation
and are billed as input tokens. The rate limiter caps requests per minute, not tokens per
request.

A pure `normalizeConversation(messages)` returns a discriminated union:

```ts
type NormalizeResult =
  | { ok: true; conversation: GeminiContent[]; lastUserMessage: string }
  | { ok: false; error: string };
```

Rules, applied in order:

1. Reject a non-array or empty input.
2. Drop entries whose `content` is not a string, or is whitespace-only after trimming.
3. Reject if any single message exceeds **2,000 characters**.
4. Keep only the last **10** messages.
5. Reject if the retained messages total more than **8,000 characters**.
6. Map to Gemini's shape: `role: "assistant"` becomes `"model"`, anything else `"user"`.

Rejecting oversized input rather than truncating it is deliberate — a silently truncated
question produces a confidently wrong answer, which is worse than a clear error.

Being pure and network-free, this is directly testable.

### 3. Timeout and unified degraded mode

The fetch gets `signal: AbortSignal.timeout(15_000)` and is wrapped in try/catch. Aborts and
network errors route into the **same** fallback path as 429 and 5xx, making `buildLocalReply()`
the single degraded-mode entry point instead of covering only two of four failure modes.

### 4. Security and cost

- Send the key as an `x-goog-api-key` header; drop `?key=` so the secret stays out of proxy
  and access logs. Confirmed as the documented form for both endpoints.
- `console.error` Gemini's error text server-side; return a generic message to the client.
- Add `generationConfig: { maxOutputTokens: 512 }`. This will visibly truncate unusually long
  answers — an accepted trade for bounded cost.

### 5. Streaming

Switch to `:streamGenerateContent?alt=sse`. Each SSE line is `data: {...}` carrying the same
`candidates[0].content.parts[].text` shape as the non-streaming response, so text extraction
logic is unchanged per chunk.

**The core tension:** once bytes are written under a `200`, the response cannot switch to a
JSON error. A naive streaming rewrite would destroy the existing fallback.

Resolution — **do not commit to a stream until the first chunk parses successfully**:

- Non-ok HTTP status, timeout, or network error before the first byte → return the JSON
  fallback exactly as today. This covers quota exhaustion and timeouts, which fail immediately
  and are the overwhelmingly common cases.
- Failure *after* streaming has begun → append a short plain-text notice to the open stream
  and close it. No status change is possible or attempted.

The route therefore returns one of two content types, and the client branches on
`Content-Type`:

| Response | Client handling |
|---|---|
| `application/json` | Existing error / `buildLocalReply` path, unchanged |
| `text/plain; charset=utf-8` | Reader loop |

The client replaces `await response.json()` with a `getReader()` loop: append one assistant
message on first chunk, then replace its content as chunks arrive. `isSending` still drives the
send button's disabled state, but the `Thinking...` bubble is dismissed on first token rather
than on completion.

### 6. Tests

The repo already has a passing suite — `lib/konami.test.ts` and `lib/multi-click.test.ts`,
11 tests via `vitest run`. New tests follow that established convention: colocated in `lib/`
beside the module under test, `import { describe, it, expect } from "vitest"`, relative import
of the subject, no config file and no setup file.

These three cover pure logic only — no network mocking, no component rendering.

**`lib/chat-context.test.ts`** — the regression guard for finding #1:
- `skills` and `links` are present in the context
- `gallery` and `footer` are absent
- `portfolioContextJson` parses back to `portfolioContext`

**`lib/chat-validation.test.ts`**:
- empty array and non-array are rejected
- a message over 2,000 chars is rejected
- a conversation over 8,000 total chars is rejected
- more than 10 messages keeps only the last 10
- `assistant` maps to `model`; unknown roles map to `user`
- whitespace-only messages are dropped
- `lastUserMessage` reflects the final user turn

**`lib/rate-limit.test.ts`** (fake timers):
- requests under the limit are allowed, `remaining` counts down accurately
- the 11th request within a window is denied with a positive `resetInSeconds`
- a request after the window expires is allowed again
- distinct IPs have independent budgets

### Files

| File | Change |
|---|---|
| `lib/chat-context.ts` | new — denylist context builder |
| `lib/chat-validation.ts` | new — `normalizeConversation` |
| `app/api/chat/route.ts` | rewrite — streaming, timeout, header auth, unified fallback |
| `components/chat-assistant.tsx` | stream reading, content-type branching |
| `lib/chat-context.test.ts` | new |
| `lib/chat-validation.test.ts` | new |
| `lib/rate-limit.test.ts` | new |

## Rejected: RAG

The question that opened this work was whether to add retrieval. It was measured and rejected.

| | |
|---|---|
| Entire `profile-data.json` | 9,017 chars ≈ **~2,300 tokens** |
| Gemini Flash context window | **~1,000,000 tokens** |
| Corpus as a share of the window | **~0.2%** |

The route already does what RAG approximates: it places the complete corpus in front of the
model. Retrieval exists to solve a corpus that does not fit in context; this one fits roughly
400 times over.

Adding it would introduce chunking, an embedding model, a vector store, a per-query embedding
call, and a re-embed step on every content edit — and in exchange the model would see *less*
data than it does now. Every retrieval miss would become a false "I don't have that
information" on a question the current design answers correctly.

Finding #1 makes the point concrete: the bot's real weakness was four keys missing from an
object literal. No retrieval system would have helped.

**Revisit when** long-form content is added — blog posts, detailed case studies, talk
transcripts — and the corpus passes roughly 100–200KB. At that point per-request cost and
precision genuinely start to favor retrieval. That is about 20x the current size.

## Decisions and assumptions

- **2,000 chars per message, 8,000 per conversation, 15s timeout, 512 output tokens** — chosen
  as sane defaults, not derived from measurement. All are single-constant changes.
- **`gallery` and `footer` excluded** — presentation-only. If the bot should ever answer "what's
  in the gallery?", `gallery` moves out of the denylist.
- **The model default stays `gemini-3-flash-preview`** (`route.ts:71`, overridable via
  `GEMINI_MODEL`). Pinning a preview model is a stability risk worth revisiting, but changing
  it is out of scope here.
- **Client-supplied conversation history is unchanged.** A crafted request can still forge
  `assistant` turns to steer the model. Low stakes for a public portfolio with no privileged
  data behind the endpoint; noted rather than fixed.
- **No `vitest.config.ts` is added.** Relative imports keep the existing zero-config setup
  working. If app-code aliases are ever needed in tests, that config becomes necessary.

## Verification

- `npm test` — all suites pass, including the 11 pre-existing tests.
- `npm run lint` — clean.
- `npm run build` — succeeds.
- Manual: with `GEMINI_API_KEY` set, ask "What are Franze's skills?" and "How do I contact
  him?" — both must answer from context rather than declining. Reply text must appear
  progressively, not in one block.
- Manual: with a deliberately invalid `GEMINI_API_KEY`, the widget must still return a
  `buildLocalReply` answer rather than an error bubble.
