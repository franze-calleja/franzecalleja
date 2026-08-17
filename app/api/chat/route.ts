import { NextResponse } from "next/server";

import {
  portfolioContext,
  portfolioContextJson,
  type PortfolioContext,
} from "@/lib/chat-context";
import { normalizeConversation } from "@/lib/chat-validation";
import { createSseTextParser } from "@/lib/gemini-stream";
import { checkRateLimit } from "@/lib/rate-limit";

/** How long to wait for Gemini before answering from local data instead. */
const GEMINI_TIMEOUT_MS = 15_000;

/** Upper bound on generated response length, to keep per-request cost bounded. */
const MAX_OUTPUT_TOKENS = 512;

/** Built once — the portfolio data is static for the life of the process. */
const SYSTEM_INSTRUCTION = [
  "Your name is AZRA (AZRA v2.1). You are the dedicated AI model and assistant for Franze William Calleja's personal portfolio.",
  "When asked who you are, what your name is, or what model you are, always introduce yourself as AZRA (Franze's portfolio AI assistant).",
  "Do not introduce yourself as Gemini or a Google model unless specifically asked about the underlying technology/API.",
  "Answer questions using only the portfolio context provided below.",
  "If the answer is not in the context, say you do not have that information.",
  "Keep responses short, natural, and factual.",
  `Portfolio context: ${portfolioContextJson}`,
].join("\n\n");

function buildLocalReply(question: string, context: PortfolioContext) {
  const normalizedQuestion = question.toLowerCase();

  if (
    normalizedQuestion.includes("who are you") ||
    normalizedQuestion.includes("what is your name") ||
    normalizedQuestion.includes("your name") ||
    normalizedQuestion.includes("azra")
  ) {
    return "I am AZRA, Franze William Calleja's portfolio AI assistant.";
  }

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
    normalizedQuestion.includes("tell me about")
  ) {
    return context.about.title;
  }

  return `I am AZRA. I may not have a live AI response right now, but I can still help with Franze's profile, projects, experience, tech stack, education, and availability.`;
}

/** Answer from local portfolio data when Gemini is unavailable. */
function localFallbackResponse(lastUserMessage: string, warning: string) {
  return NextResponse.json({
    reply: buildLocalReply(lastUserMessage, portfolioContext),
    model: "azra-fallback",
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

  const normalized = normalizeConversation(body?.messages);

  if (!normalized.ok) {
    return NextResponse.json({ error: normalized.error }, { status: 400 });
  }

  const requestBody = {
    systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
    contents: normalized.conversation,
    generationConfig: {
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      // Gemini 3 models default to "high" thinking, and thinking tokens draw
      // from the same maxOutputTokens budget as the visible reply — at 512
      // tokens, high thinking can consume the whole budget and leave no text
      // parts at all. Portfolio answers are short and factual, so low
      // thinking is enough and keeps the budget for actual output.
      thinkingConfig: { thinkingLevel: "LOW" },
    },
  };

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

    // Every non-ok upstream response falls back to local data rather than
    // erroring out — this includes 400 (e.g. an invalid API key) and 403
    // (e.g. a restricted key), not just quota/server errors, so a
    // misconfigured or retired key degrades gracefully instead of showing
    // the visitor an error bubble.
    return localFallbackResponse(
      normalized.lastUserMessage,
      response.status === 429
        ? "AZRA quota is exhausted, so the assistant is answering from local portfolio data."
        : "AZRA engine is temporarily unavailable, so this answer comes from local portfolio data.",
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
    cancel() {
      void reader.cancel();
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
