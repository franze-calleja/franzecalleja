import { describe, it, expect } from "vitest";

import {
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

  it("accepts a conversation exactly at the total limit", () => {
    // 10 messages x 800 chars = exactly 8,000
    const messages = Array.from({ length: 10 }, () =>
      userMessage("a".repeat(800)),
    );

    const result = normalizeConversation(messages);
    expect(result.ok).toBe(true);
  });

  // Regression coverage for the widget-bricking bug: an oversize message must
  // only ever be rejected when it is the newest turn. An oversize turn stuck
  // in history (e.g. a maximally long past Gemini reply, or a rejected
  // message a client failed to strip) must be dropped silently rather than
  // repeatedly rejecting an otherwise-valid new question.
  it("drops an oversize message in history but accepts a short newest turn", () => {
    const result = normalizeConversation([
      userMessage("a".repeat(MAX_MESSAGE_CHARS + 500)),
      userMessage("a short follow-up question"),
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.conversation).toHaveLength(1);
      expect(result.conversation[0].parts[0].text).toBe("a short follow-up question");
    }
  });

  it("rejects when the newest turn itself is over the per-message limit", () => {
    const result = normalizeConversation([
      userMessage("a short earlier question"),
      userMessage("a".repeat(MAX_MESSAGE_CHARS + 1)),
    ]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain(String(MAX_MESSAGE_CHARS));
    }
  });

  it("drops an oversize assistant turn in history and keeps a short newest user turn", () => {
    const result = normalizeConversation([
      userMessage("first question"),
      { role: "assistant", content: "a".repeat(MAX_MESSAGE_CHARS + 200) },
      userMessage("second question"),
    ]);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.conversation).toHaveLength(2);
      expect(result.conversation.map((turn) => turn.parts[0].text)).toEqual([
        "first question",
        "second question",
      ]);
    }
  });
});
