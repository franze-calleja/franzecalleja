import { NextResponse } from "next/server";

import content from "@/app/profile-data.json";
import { checkRateLimit } from "@/lib/rate-limit";

type IncomingMessage = {
  role?: "user" | "assistant";
  content?: string;
};

type PortfolioContext = {
  profile: typeof content.profile;
  about: typeof content.about;
  experience: typeof content.experience;
  techstack: typeof content.techstack;
  projects: typeof content.projects;
  education: typeof content.education;
  testimonials: typeof content.testimonials;
  availability: typeof content.availability;
};

function buildLocalReply(question: string, portfolioContext: PortfolioContext) {
  const normalizedQuestion = question.toLowerCase();

  if (normalizedQuestion.includes("project") || normalizedQuestion.includes("work")) {
    const projectNames = portfolioContext.projects.items
      .slice(0, 4)
      .map((project) => project.name)
      .join(", ");

    return `Recent projects include ${projectNames}. I can also share the technologies used on each one.`;
  }

  if (normalizedQuestion.includes("tech") || normalizedQuestion.includes("stack") || normalizedQuestion.includes("tools")) {
    const techLabels = portfolioContext.techstack.items
      .slice(0, 6)
      .map((tech) => tech.label)
      .join(", ");

    return `Franze works mainly with ${techLabels}, along with backend tools like Prisma, MySQL, PostgreSQL, Docker, and Git.`;
  }

  if (normalizedQuestion.includes("experience") || normalizedQuestion.includes("job") || normalizedQuestion.includes("role")) {
    const firstRoles = portfolioContext.experience.steps
      .slice(0, 3)
      .map((step) => `${step.title} at ${step.caption}`)
      .join("; ");

    return `He has experience as ${firstRoles}.`;
  }

  if (normalizedQuestion.includes("education") || normalizedQuestion.includes("school") || normalizedQuestion.includes("college")) {
    const education = portfolioContext.education.items[0];

    return `${education.degree} at ${education.institution} (${education.year}), with honors: ${education.honors}.`;
  }

  if (normalizedQuestion.includes("available") || normalizedQuestion.includes("contact") || normalizedQuestion.includes("hire")) {
    return `${portfolioContext.availability.status}. ${portfolioContext.availability.description}`;
  }

  if (normalizedQuestion.includes("about") || normalizedQuestion.includes("who are you") || normalizedQuestion.includes("tell me about")) {
    return portfolioContext.about.title;
  }

  return `I may not have a live Gemini response right now, but I can still help with Franze's profile, projects, experience, tech stack, education, and availability.`;
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
    messages?: IncomingMessage[];
  } | null;

  if (!body?.messages?.length) {
    return NextResponse.json(
      { error: "No messages were provided." },
      { status: 400 },
    );
  }

  // --- Rate limiting ---
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
  // ---------------------

  const conversation = body.messages
    .filter((message) => typeof message.content === "string" && message.content.trim())
    .slice(-10)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content!.trim() }],
    }));

  const portfolioContext: PortfolioContext = {
    profile: content.profile,
    about: content.about,
    experience: content.experience,
    techstack: content.techstack,
    projects: content.projects,
    education: content.education,
    testimonials: content.testimonials,
    availability: content.availability,
  };

  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text: [
            "You are a concise, helpful assistant for Franze William Calleja's personal portfolio.",
            "Answer questions using only the portfolio context provided below.",
            "If the answer is not in the context, say you do not have that information.",
            "Keep responses short, natural, and factual.",
            `Portfolio context: ${JSON.stringify(portfolioContext)}`,
          ].join("\n\n"),
        },
      ],
    },
    contents: conversation,
  };

  let lastErrorText = "";
  const lastUserMessage = conversation
    .slice()
    .reverse()
    .find((message) => message.role === "user")?.parts?.[0]?.text ?? "";

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (response.ok) {
    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
    };

    const reply = data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();

    if (!reply) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { reply, model: modelName },
      { headers: { "X-RateLimit-Remaining": String(remaining) } },
    );
  }

  lastErrorText = await response.text();

  if (response.status === 429 || response.status >= 500) {
    return NextResponse.json({
      reply: buildLocalReply(lastUserMessage, portfolioContext),
      model: "local-fallback",
      warning: response.status === 429
        ? "Gemini quota is exhausted, so the assistant is answering from local portfolio data."
        : `Gemini request failed, so the assistant is answering from local portfolio data. Last error: ${lastErrorText}`,
    });
  }

  return NextResponse.json(
    { error: `Gemini request failed: ${lastErrorText}` },
    { status: response.status },
  );
}