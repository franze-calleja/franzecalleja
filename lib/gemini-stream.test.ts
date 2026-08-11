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

  it("reassembles the full text correctly no matter where the chunk boundary falls", () => {
    const fixture = sseLine("Hello") + sseLine(" wonderful") + sseLine(" world");
    const expected = "Hello wonderful world";

    for (let splitAt = 0; splitAt <= fixture.length; splitAt += 1) {
      const parser = createSseTextParser();

      const firstTexts = parser.push(fixture.slice(0, splitAt));
      const secondTexts = parser.push(fixture.slice(splitAt));

      expect([...firstTexts, ...secondTexts].join("")).toBe(expected);
    }
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
