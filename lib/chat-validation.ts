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

  // Pass 1: keep only turns with non-blank string content. No length check
  // here — an oversize turn buried in history must not be able to reject the
  // whole request (that's what bricks the widget once such a turn is stuck
  // in client-side state; see the per-turn check below, applied post-slice).
  for (const message of messages) {
    const content = (message as { content?: unknown })?.content;

    if (typeof content !== "string") {
      continue;
    }

    const text = content.trim();

    if (!text) {
      continue;
    }

    const role = (message as { role?: unknown })?.role;
    turns.push({ role: role === "assistant" ? "model" : "user", text });
  }

  if (turns.length === 0) {
    return { ok: false, error: "No messages were provided." };
  }

  const recent = turns.slice(-MAX_MESSAGES);

  // Reject only on the newest turn: it's the user's current input, so an
  // accurate "shorten your question" error applies. An oversize turn earlier
  // in history is dropped instead, below.
  const newest = recent[recent.length - 1];

  if (newest.text.length > MAX_MESSAGE_CHARS) {
    return {
      ok: false,
      error: `Messages are limited to ${MAX_MESSAGE_CHARS} characters. Please shorten your question.`,
    };
  }

  const trimmedHistory = recent
    .slice(0, -1)
    .filter((turn) => turn.text.length <= MAX_MESSAGE_CHARS);
  const kept = [...trimmedHistory, newest];

  const totalChars = kept.reduce((total, turn) => total + turn.text.length, 0);

  if (totalChars > MAX_CONVERSATION_CHARS) {
    return {
      ok: false,
      error: "This conversation is too long. Please start a new one.",
    };
  }

  const lastUserMessage =
    [...kept].reverse().find((turn) => turn.role === "user")?.text ?? "";

  return {
    ok: true,
    conversation: kept.map((turn) => ({
      role: turn.role,
      parts: [{ text: turn.text }],
    })),
    lastUserMessage,
  };
}
