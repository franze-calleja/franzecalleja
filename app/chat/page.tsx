import { Terminal } from "lucide-react";
import type { Metadata } from "next";
import ChatAssistant from "@/components/chat-assistant";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "AZRA CLI Terminal & AI Agent",
  description:
    "Interactive terminal REPL and AZRA AI agent with live context of Franze William Calleja's projects, experience, and tech stack.",
  alternates: {
    canonical: "/chat",
  },
  openGraph: {
    title: "AZRA CLI Terminal & AI Agent | Franze William Calleja",
    description:
      "Interactive terminal REPL and AZRA AI agent with live context of Franze William Calleja's projects, experience, and tech stack.",
    url: `${SITE_URL}/chat`,
    images: ["/og-image.png"],
  },
};

const cheatsheet = [
  { cmd: "/projects", desc: "List project catalog & URLs" },
  { cmd: "/devops", desc: "Docker & Observability stack" },
  { cmd: "/experience", desc: "Career timeline & roles" },
  { cmd: "/stack", desc: "Full tech & skill matrix" },
  { cmd: "/education", desc: "Academic honors & degree" },
  { cmd: "/contact", desc: "Email, GitHub & LinkedIn" },
  { cmd: "/book", desc: "Schedule a call via Calendly" },
];

export default function ChatPage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-background px-4 pb-28 pt-4 sm:px-8 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto grid w-full min-w-0 max-w-6xl items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        {/* Left Column: Context & Cheatsheet */}
        <section className="w-full min-w-0 space-y-5 sm:space-y-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
              <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
              <span>AZRA REPL // AI Agent</span>
            </div>
            <h1 className="mt-3 text-3xl font-black leading-[0.96] tracking-tight sm:mt-4 sm:text-5xl lg:text-6xl">
              QUERY THE SYSTEM.
            </h1>
            <p className="mt-4 border-l-2 border-foreground pl-3 text-sm leading-6 text-foreground/80 sm:pl-4 sm:text-base sm:leading-7 lg:text-lg">
              Interactive AZRA CLI terminal loaded with runtime context of Franze&apos;s full-stack applications, production systems, and DevOps infrastructure.
            </p>
          </div>

          {/* Quick Manual Cheatsheet */}
          <div className="w-full min-w-0 border border-foreground/40 bg-(--surface)/50 p-4 sm:p-5">
            <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                AZRA CLI Command Cheatsheet
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-(--muted)">
                v2.1
              </span>
            </div>

            <div className="mt-3.5 space-y-2 font-mono text-xs">
              {cheatsheet.map((item) => (
                <div key={item.cmd} className="flex flex-wrap items-baseline justify-between gap-2 sm:flex-nowrap sm:gap-4">
                  <span className="font-bold text-foreground">{item.cmd}</span>
                  <span className="text-right text-(--muted)">{item.desc}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-foreground/20 pt-3">
              <p className="font-mono text-[11px] text-(--muted)">
                Or ask natural questions: <br />
                <span className="text-foreground/80">&quot;How is your Prometheus stack set up?&quot;</span>
              </p>
            </div>
          </div>
        </section>

        {/* Right Column: Terminal Component */}
        <div className="w-full min-w-0">
          <ChatAssistant />
        </div>
      </div>
    </main>
  );
}