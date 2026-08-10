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
