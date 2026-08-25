import type { Metadata } from "next";
import { Gamepad2, Compass, Keyboard } from "lucide-react";
import GameCanvas from "@/components/game/game-canvas";
import { SITE_URL } from "@/lib/site";
import { CONTROLS_GUIDE } from "@/components/game/game-data";

export const metadata: Metadata = {
  title: "Pixel RPG World & AZRA AI Agent",
  description:
    "Explore Franze William Calleja's interactive Pokémon-inspired pixel world. Walk through projects, inspect tech statues, and converse with the Gemini-powered AZRA AI companion.",
  alternates: {
    canonical: "/game",
  },
  openGraph: {
    title: "Pixel RPG World & AZRA AI Agent | Franze William Calleja",
    description:
      "Explore Franze William Calleja's interactive Pokémon-inspired pixel world. Walk through projects, inspect tech statues, and converse with the Gemini-powered AZRA AI companion.",
    url: `${SITE_URL}/game`,
    images: ["/og-image.png"],
  },
};

const LANDMARK_LEGEND = [
  {
    name: "Projects Showcase Guild",
    desc: "Inspect live applications, institutional platforms, and client repos.",
    badge: "Building (North-West)",
    color: "text-indigo-400",
  },
  {
    name: "AZRA's AI Sanctuary",
    desc: "Converse in real-time with AZRA, Franze's Gemini-powered AI companion.",
    badge: "Sanctuary (North-Center)",
    color: "text-cyan-400",
  },
  {
    name: "DevOps Power Station",
    desc: "Docker, Prometheus, Grafana, Loki & 99.9% uptime architecture.",
    badge: "Facility (North-East)",
    color: "text-emerald-400",
  },
  {
    name: "Avenue of RPG Banners",
    desc: "Multiple fluttering guild banners: MSEUF-CI, R-A-Ones, Ellipsense, Techbears.",
    badge: "Banners (East Plaza)",
    color: "text-amber-400",
  },
  {
    name: "Tech Arsenal Statues",
    desc: "React/Next.js atom, TypeScript shield, PostgreSQL relic & Docker whale.",
    badge: "Statues (West Plaza)",
    color: "text-sky-400",
  },
  {
    name: "Academy of Enverga Dojo",
    desc: "BS in Information Technology • Magna Cum Laude honors temple.",
    badge: "Dojo (South-East)",
    color: "text-red-400",
  },
  {
    name: "The GOAT Court & PS5 Lounge",
    desc: "LeBron #23 championship banner, basketball hoop, and PS5 gaming cottage.",
    badge: "Court (South-West)",
    color: "text-purple-400",
  },
];

export default function GamePage() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-background px-4 pb-28 pt-4 sm:px-8 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header Section */}
        <header className="space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
            <Gamepad2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
            <span>Interactive Retro RPG // Dev World</span>
          </div>

          <h1 className="text-3xl font-black leading-[0.96] tracking-tight sm:text-5xl lg:text-6xl">
            EXPLORE THE OVERWORLD.
          </h1>

          <p className="max-w-3xl border-l-2 border-foreground pl-3 text-sm leading-6 text-foreground/80 sm:pl-4 sm:text-base sm:leading-7">
            A Pokémon-inspired retro pixel world showcasing Franze William Calleja&apos;s full-stack applications, engineering timeline, and infrastructure. Walk up to buildings, statues, or people to interact, and talk directly with the Gemini-powered <strong>AZRA AI agent</strong>.
          </p>
        </header>

        {/* The Game Canvas Engine */}
        <section aria-label="Interactive Game Screen">
          <GameCanvas />
        </section>

        {/* Bottom Legend & Controls Cards */}
        <section className="grid gap-6 md:grid-cols-2">
          {/* Controls Cheatsheet */}
          <div className="rounded-lg border border-foreground/30 bg-(--surface)/60 p-5 font-mono">
            <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-foreground">
                <Keyboard className="h-4 w-4" />
                <span>Trainer Controls</span>
              </div>
              <span className="text-[10px] text-(--muted)">Keyboard & Touch</span>
            </div>

            <div className="mt-3.5 space-y-2 text-xs">
              {CONTROLS_GUIDE.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between border-b border-foreground/5 pb-1"
                >
                  <span className="rounded bg-foreground px-2 py-0.5 font-bold text-background">
                    {item.key}
                  </span>
                  <span className="text-(--muted)">{item.label}</span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-(--muted)">
              💡 Mobile users can use the on-screen virtual D-Pad and Action buttons (A: Interact, B: Run).
            </p>
          </div>

          {/* World Landmark Guide */}
          <div className="rounded-lg border border-foreground/30 bg-(--surface)/60 p-5 font-mono">
            <div className="flex items-center justify-between border-b border-foreground/20 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase text-foreground">
                <Compass className="h-4 w-4" />
                <span>Town Landmark Guide</span>
              </div>
              <span className="text-[10px] text-(--muted)">6 Key Locations</span>
            </div>

            <div className="mt-3.5 space-y-3 text-xs">
              {LANDMARK_LEGEND.map((landmark) => (
                <div key={landmark.name} className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{landmark.name}</span>
                    <span className="text-[10px] font-semibold text-(--muted)">
                      {landmark.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-(--muted)">{landmark.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
