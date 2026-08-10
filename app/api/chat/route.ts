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
