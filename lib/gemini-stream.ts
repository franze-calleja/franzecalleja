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
