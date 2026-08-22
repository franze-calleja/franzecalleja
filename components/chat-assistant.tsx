"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Terminal, Eraser, CornerDownLeft, Sparkles } from "lucide-react";

import content from "@/app/profile-data.json";

type CliEntry = {
  id: string;
  type: "system" | "user" | "assistant" | "error";
  command?: string;
  content: string;
  warning?: string;
  timestamp?: string;
};

const DESKTOP_SYSTEM_BANNER = `┌──────────────────────────────────────────────────────────────┐
│  AZRA_CLI :: PORTFOLIO RUNTIME INTERFACE [v2.1]              │
│  Interactive AZRA engine powered by Gemini + live context.   │
└──────────────────────────────────────────────────────────────┘
[sys] Context initialized: 5 roles, 10 projects, 28 stack tools, 1 degree
[sys] Type any question or run slash commands. Try /help for manual.`;

const MOBILE_SYSTEM_BANNER = `┌──────────────────────────────────────────────┐
│ AZRA_CLI :: PORTFOLIO RUNTIME INTERFACE      │
│ AZRA engine (Gemini) + context loaded [v2.1] │
└──────────────────────────────────────────────┘
[sys] Context initialized: 5 roles, 10 projects, 28 tools, 1 degree
[sys] Type any question or run slash commands. Try /help.`;

const QUICK_COMMANDS = [
  { label: "/help", desc: "List CLI commands" },
  { label: "/projects", desc: "Featured projects" },
  { label: "/devops", desc: "Observability & Docker" },
  { label: "/experience", desc: "Career timeline" },
  { label: "/stack", desc: "Core technologies" },
  { label: "/contact", desc: "Get in touch" },
  { label: "/book", desc: "Schedule a call" },
  { label: "/clear", desc: "Clear screen" },
] as const;

function getTimestamp() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
}

export default function ChatAssistant() {
  const [entries, setEntries] = useState<CliEntry[]>([
    {
      id: "init-banner",
      type: "system",
      content: DESKTOP_SYSTEM_BANNER,
      timestamp: getTimestamp(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries, isExecuting]);

  // Elapsed timer while executing / thinking (Claude Code style)
  useEffect(() => {
    if (!isExecuting) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 100);

    return () => clearInterval(interval);
  }, [isExecuting]);

  // Focus terminal input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function clearTerminal() {
    setEntries([
      {
        id: `clear-${Date.now()}`,
        type: "system",
        content: DESKTOP_SYSTEM_BANNER,
        timestamp: getTimestamp(),
      },
    ]);
    setInput("");
    setHistoryIndex(-1);
  }

  // Handle local slash commands with Claude Code style thinking state
  async function handleSlashCommand(cmd: string): Promise<boolean> {
    const normalized = cmd.trim().toLowerCase();

    if (normalized === "/clear" || normalized === "clear" || normalized === "cls") {
      clearTerminal();
      return true;
    }

    const knownCommands = [
      "/help",
      "help",
      "/projects",
      "projects",
      "/devops",
      "/observability",
      "devops",
      "/experience",
      "experience",
      "/stack",
      "stack",
      "/education",
      "education",
      "/contact",
      "contact",
      "/book",
      "book",
      "/about",
      "about",
    ];

    if (!knownCommands.includes(normalized)) {
      return false;
    }

    // Add user entry first
    setEntries((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        type: "user",
        command: cmd,
        content: cmd,
        timestamp: getTimestamp(),
      },
    ]);

    // Show thinking indicator for a realistic moment
    setIsExecuting(true);
    await new Promise((resolve) => setTimeout(resolve, 450));

    switch (normalized) {
      case "/help":
      case "help":
        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: "system",
            content: `AVAILABLE COMMANDS & MANUAL:
  /projects       List selected engineering projects, live links & tech stacks
  /experience     Display professional career timeline & active roles
  /devops         Inspect Docker, Prometheus, Grafana & Loki observability stack
  /stack          Print complete tech stack & skill familiarity matrix
  /education      View academic degree, honors (Salutatorian, Magna Cum Laude)
  /contact        Show email, GitHub, LinkedIn & location
  /book           Schedule a call via Calendly
  /about          Display full engineer bio, PS5 gaming & LeBron James loyalty
  /clear          Clear terminal scrollback buffer
  /help           Show this command manual

Natural language queries are also supported:
  e.g. "What AI tools does Franze use?"
  e.g. "Tell me about his work at MSEUF-CI."`,
            timestamp: getTimestamp(),
          },
        ]);
        break;

      case "/projects":
      case "projects":
        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: "assistant",
            content: `[PROJECT CATALOG]
${content.projects.items
  .slice(0, 5)
  .map(
    (p, i) => `0${i + 1}. ${p.name}
    Description:  ${p.description}
    Technologies: ${p.technologies.join(", ")}
    URL:          ${p.href}`,
  )
  .join("\n\n")}

Type any project name for deeper architecture details.`,
            timestamp: getTimestamp(),
          },
        ]);
        break;

      case "/devops":
      case "/observability":
      case "devops":
        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: "assistant",
            content: `[DEVOPS & OBSERVABILITY ARCHITECTURE]
Containerization:
  • Docker (Image-based container deployments & staging environments)

Metrics, Telemetry & Alerts:
  • Prometheus + node_exporter (Node & host metrics ingestion)
  • Grafana (Interactive dashboards, alerts & query visualizations)

Logging & Health Monitoring:
  • Loki + Grafana Alloy (Distributed log collection & aggregation)
  • Dozzle (Real-time container log viewer)
  • Uptime Kuma (Service health checks & uptime monitors)

Cloud & Infrastructure:
  • AWS, GCP, Hostinger VPS, CI/CD automated deployment pipelines`,
            timestamp: getTimestamp(),
          },
        ]);
        break;

      case "/experience":
      case "experience":
        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: "assistant",
            content: `[PROFESSIONAL CAREER TIMELINE]
01. MSEUF-CI (August 2025 - Present) [ACTIVE]
    Role:  Fullstack Software Engineer
    Scope: Large-scale enterprise systems, Docker containerization, Prometheus/Grafana observability.

02. R-A-Ones Corporation (January 2026 - Present) [ACTIVE]
    Role:  Lead Software Engineer
    Scope: Startup cloud architecture, high-throughput backend services, React Native mobile apps.

03. Ellipsense (2023 - Present) [ACTIVE]
    Role:  Freelance Lead Developer
    Scope: Global client product roadmaps, full-stack systems, technical scoping.

04. Techbears Solutions (August 2025 - January 2026)
    Role:  Web Developer
    Scope: Ride-hailing admin dashboard, CASL RBAC, real-time fleet dispatch APIs.

05. Linoflap Technology (February - May 2025)
    Role:  Frontend Developer Intern
    Scope: Modern responsive UI engineering & RESTful API integration.`,
            timestamp: getTimestamp(),
          },
        ]);
        break;

      case "/stack":
      case "stack":
        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: "assistant",
            content: `[TECHNICAL STACK & CAPABILITIES]
AI & Automation: Claude Code, Codex, Ollama, Hermes, n8n, Gemini API, Multi-Agent Harnesses
Frontend:       TypeScript, React, Next.js, shadcn/ui, TanStack, React Native, Expo, Tailwind, Vitest, Zustand
Backend:        Node.js, Express.js, Python, Flask, Prisma ORM, PostgreSQL, MySQL, PHP, Rust (Axum)
Infrastructure: Docker, Grafana, Prometheus, Loki, Alloy, Uptime Kuma, CI/CD, AWS, GCP`,
            timestamp: getTimestamp(),
          },
        ]);
        break;

      case "/education":
      case "education":
        const edu = content.education.items[0];
        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: "assistant",
            content: `[ACADEMIC CREDENTIAL]
Degree:       ${edu.degree}
Institution:  ${edu.institution} (${edu.year})
Honors:       ★ ${edu.honors}
Focus:        Software Architecture, Distributed Systems, Algorithms, Database Systems`,
            timestamp: getTimestamp(),
          },
        ]);
        break;

      case "/contact":
      case "contact":
        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: "assistant",
            content: `[CONTACT & SOCIAL LINKS]
Email:    franzewilliamcalleja@gmail.com
GitHub:   https://github.com/franze-calleja
LinkedIn: https://www.linkedin.com/in/franze-calleja
Book:     ${content.availability.bookingHref}
Location: Candelaria, Quezon, Philippines
Status:   ${content.availability.status} (${content.availability.description})`,
            timestamp: getTimestamp(),
          },
        ]);
        break;

      case "/book":
      case "book":
        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: "assistant",
            content: `[SCHEDULE A CALL]
Booking:    ${content.availability.bookingHref}
Status:     ${content.availability.status}
Timezone:   Philippines (UTC+8)

Open the link above to pick any available slot on Franze's calendar.`,
            timestamp: getTimestamp(),
          },
        ]);
        break;

      case "/about":
      case "about":
        setEntries((prev) => [
          ...prev,
          {
            id: `res-${Date.now()}`,
            type: "assistant",
            content: `[DEVELOPER OVERVIEW]
${content.about.title}

${content.about.body.join("\n\n")}`,
            timestamp: getTimestamp(),
          },
        ]);
        break;
    }

    setIsExecuting(false);
    return true;
  }

  async function executeInput(rawText: string) {
    const trimmed = rawText.trim();
    if (!trimmed || isExecuting) return;

    // Add to input history
    setHistory((prev) => [trimmed, ...prev.filter((h) => h !== trimmed)]);
    setHistoryIndex(-1);
    setInput("");

    // Check for local slash commands first
    if (
      trimmed.startsWith("/") ||
      [
        "help",
        "clear",
        "projects",
        "stack",
        "experience",
        "devops",
        "contact",
        "book",
        "about",
      ].includes(trimmed.toLowerCase())
    ) {
      const handled = await handleSlashCommand(trimmed);
      if (handled) {
        return;
      }
    }

    // Otherwise, dispatch to the Gemini Chat API
    const userEntry: CliEntry = {
      id: `user-${Date.now()}`,
      type: "user",
      content: trimmed,
      timestamp: getTimestamp(),
    };

    setEntries((prev) => [...prev, userEntry]);
    setIsExecuting(true);

    // Format conversation history for API
    const apiMessages = entries
      .filter((e) => e.type === "user" || e.type === "assistant")
      .map((e) => ({
        role: e.type === "user" ? ("user" as const) : ("assistant" as const),
        content: e.content,
      }));

    apiMessages.push({ role: "user", content: trimmed });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok || contentType.includes("application/json")) {
        const data = (await response.json()) as {
          reply?: string;
          error?: string;
          warning?: string;
        };

        if (!response.ok) {
          setEntries((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              type: "error",
              content: `[error] ${data.error ?? "Failed to execute query."}`,
              timestamp: getTimestamp(),
            },
          ]);
          return;
        }

        setEntries((prev) => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            type: "assistant",
            content: data.reply ?? "Query completed with no output.",
            warning: data.warning,
            timestamp: getTimestamp(),
          },
        ]);
        return;
      }

      // Stream text response
      const reader = response.body?.getReader();
      if (!reader) {
        setEntries((prev) => [
          ...prev,
          {
            id: `reply-${Date.now()}`,
            type: "assistant",
            content: "Stream reader unavailable.",
            timestamp: getTimestamp(),
          },
        ]);
        return;
      }

      const decoder = new TextDecoder();
      let assistantText = "";
      const streamId = `stream-${Date.now()}`;

      // Insert placeholder for stream
      setEntries((prev) => [
        ...prev,
        {
          id: streamId,
          type: "assistant",
          content: "",
          timestamp: getTimestamp(),
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        assistantText += decoder.decode(value, { stream: true });

        setEntries((prev) =>
          prev.map((item) =>
            item.id === streamId ? { ...item, content: assistantText } : item,
          ),
        );
      }
    } catch (error) {
      console.error(error);
      setEntries((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: "error",
          content: "[error] Connection interrupted. Please re-run command.",
          timestamp: getTimestamp(),
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  }

  // Keyboard navigation for CLI history (Up / Down arrows)
  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIndex = Math.min(historyIndex + 1, history.length - 1);
      setHistoryIndex(nextIndex);
      setInput(history[nextIndex]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setInput(history[nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput("");
      }
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      clearTerminal();
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void executeInput(input);
  }

  return (
    <section className="flex h-[min(44rem,calc(100dvh-9rem))] w-full min-w-0 max-w-full flex-col overflow-hidden border border-foreground/50 bg-background font-mono shadow-[0_20px_50px_rgba(14,16,15,0.22)]">
      {/* CLI Header Bar */}
      <div className="flex w-full min-w-0 items-center justify-between border-b border-foreground/35 bg-(--surface) px-3 py-2 sm:px-5 sm:py-2.5">
        {/* Window controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="h-2.5 w-2.5 rounded-full border border-foreground/60 bg-red-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full border border-foreground/60 bg-amber-500/80" aria-hidden="true" />
          <span className="h-2.5 w-2.5 rounded-full border border-foreground/60 bg-emerald-500/80" aria-hidden="true" />
          <span className="ml-2 hidden text-xs font-semibold text-(--muted) sm:inline">
            franze@portfolio:~
          </span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-foreground sm:text-xs">
          <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
          <span>azra-cli v2.1</span>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider sm:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                isExecuting ? "bg-amber-400 animate-pulse" : "bg-emerald-500"
              }`}
              aria-hidden="true"
            />
            <span className="text-(--muted)">{isExecuting ? "BUSY" : "IDLE"}</span>
          </span>

          <button
            type="button"
            onClick={clearTerminal}
            disabled={isExecuting}
            title="Clear buffer (Ctrl+L)"
            className="flex h-6 items-center gap-1 border border-foreground/35 px-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors hover:border-foreground hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50 sm:h-7 sm:px-2 sm:text-[11px]"
            aria-label="Clear terminal"
          >
            <Eraser className="h-3 w-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 space-y-3.5 overflow-y-auto p-3.5 text-xs leading-relaxed sm:space-y-4 sm:p-5 sm:text-[13px] md:text-[13.5px]">
        {entries.map((entry) => {
          if (entry.type === "system") {
            if (entry.content === DESKTOP_SYSTEM_BANNER) {
              return (
                <div key={entry.id} className="w-full min-w-0 text-(--muted)">
                  <pre className="hidden max-w-full overflow-x-auto whitespace-pre font-mono text-[11px] font-medium leading-5 text-foreground/80 sm:block sm:text-xs md:text-[13px]">
                    {DESKTOP_SYSTEM_BANNER}
                  </pre>
                  <pre className="block max-w-full overflow-x-auto whitespace-pre font-mono text-[11px] font-medium leading-4 text-foreground/80 sm:hidden">
                    {MOBILE_SYSTEM_BANNER}
                  </pre>
                </div>
              );
            }

            return (
              <div key={entry.id} className="w-full min-w-0 text-(--muted)">
                <pre className="max-w-full overflow-x-auto whitespace-pre-wrap font-mono text-[11px] font-medium leading-4 text-foreground/80 sm:whitespace-pre sm:text-xs sm:leading-5 md:text-[13px]">
                  {entry.content}
                </pre>
              </div>
            );
          }

          if (entry.type === "user") {
            return (
              <div key={entry.id} className="flex w-full min-w-0 items-start gap-2 text-foreground">
                <span className="font-bold text-foreground select-none">❯</span>
                <span className="break-words font-semibold text-foreground">{entry.content}</span>
                {entry.timestamp && (
                  <span className="ml-auto text-[10px] text-(--muted) select-none">
                    {entry.timestamp}
                  </span>
                )}
              </div>
            );
          }

          if (entry.type === "error") {
            return (
              <div key={entry.id} className="w-full min-w-0 border-l-2 border-red-500 bg-red-500/10 p-2.5 text-red-600 dark:text-red-400">
                <pre className="whitespace-pre-wrap break-words font-mono">{entry.content}</pre>
              </div>
            );
          }

          return (
            <div key={entry.id} className="w-full min-w-0 space-y-1.5 border-l-2 border-foreground/40 pl-3 text-foreground/90 sm:pl-3.5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-(--muted) select-none sm:text-[11px]">
                <Sparkles className="h-3 w-3" />
                <span>azra // response</span>
                {entry.timestamp && <span className="ml-auto text-[10px]">{entry.timestamp}</span>}
              </div>
              <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground/90 sm:text-[13px]">
                {entry.content}
              </pre>
              {entry.warning && (
                <p className="font-mono text-[10px] text-(--muted) italic sm:text-[11px]">{entry.warning}</p>
              )}
            </div>
          );
        })}

        {isExecuting && (
          <div className="flex items-center gap-2 border-l-2 border-foreground/40 pl-3 font-mono text-xs text-(--muted) sm:pl-3.5">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" aria-hidden="true" />
            <span className="font-semibold text-foreground/90">Thinking...</span>
            <span className="text-[11px] text-(--muted)">
              ({(elapsedTime / 10).toFixed(1)}s)
            </span>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>

      {/* Quick Slash Command Suggestions */}
      <div className="w-full min-w-0 border-t border-foreground/20 bg-(--surface)/60 px-3 py-2 sm:px-5">
        <div className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-(--muted) shrink-0 select-none sm:text-[11px]">
            Shortcuts:
          </span>
          {QUICK_COMMANDS.map((cmd) => (
            <button
              key={cmd.label}
              type="button"
              onClick={() => void executeInput(cmd.label)}
              disabled={isExecuting}
              className="inline-flex shrink-0 items-center gap-1 border border-foreground/30 px-1.5 py-0.5 font-mono text-[10px] font-medium transition-all hover:border-foreground hover:bg-foreground hover:text-background disabled:opacity-50 sm:px-2 sm:text-[11px]"
            >
              <span className="font-bold">{cmd.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Input Line */}
      <form
        onSubmit={handleSubmit}
        className="flex w-full min-w-0 items-center gap-2 border-t border-foreground/35 bg-background p-2.5 sm:p-4"
      >
        <span className="font-mono font-bold text-sm text-foreground select-none sm:text-base">
          ❯
        </span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isExecuting}
          placeholder="Ask anything or type /help..."
          className="h-9 min-w-0 flex-1 bg-transparent font-mono text-xs text-foreground placeholder:text-(--muted) outline-none sm:h-10 sm:text-sm"
        />
        <button
          type="submit"
          disabled={isExecuting || !input.trim()}
          className="flex h-8 shrink-0 items-center gap-1 border border-foreground bg-foreground px-2.5 font-mono text-xs font-bold uppercase tracking-wider text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:gap-1.5 sm:px-3.5"
          aria-label="Execute prompt"
        >
          <span>Run</span>
          <CornerDownLeft className="h-3 w-3" />
        </button>
      </form>
    </section>
  );
}