"use client";

import Link from "next/link";
import content from "@/app/profile-data.json";
import { useGsapReveal } from "@/components/b-side/use-gsap-reveal";
import BrutalBlock from "@/components/b-side/brutal-block";

const sortedTech = [...content.techstack.items].sort((a, b) => b.level - a.level);

function bar(level: number) {
  const filled = Math.max(0, Math.min(10, Math.round(level / 10)));
  return "█".repeat(filled) + " ".repeat(10 - filled);
}

export default function BSideStackPage() {
  const ref = useGsapReveal<HTMLDivElement>();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
      <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
        <h1 className="bs-h" style={{ fontSize: "2rem" }}>TECH STACK & SKILLS</h1>
        <Link href="/b-side" className="bs-tag">← BACK</Link>
      </div>
      <div ref={ref} style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <BrutalBlock>
          <span className="bs-idx">STACK</span>
          <div className="bs-mono" style={{ marginTop: "0.6rem", fontSize: "0.78rem", lineHeight: 2 }}>
            {sortedTech.map((t) => (
              <div key={t.label} style={{ whiteSpace: "pre" }}>
                {t.label.padEnd(14, " ")} [{bar(t.level)}] {t.level}
              </div>
            ))}
          </div>
        </BrutalBlock>
        <BrutalBlock className="bs-fill-ink">
          <span className="bs-idx" style={{ background: "#ffe600", color: "#0E100F" }}>SKILLS</span>
          <div className="bs-mono" style={{ marginTop: "0.6rem", fontSize: "0.78rem", lineHeight: 2 }}>
            {content.skills.overall.map((s) => (
              <div key={s.label} style={{ whiteSpace: "pre" }}>
                {s.label.padEnd(10, " ")} [{bar(s.level)}] {s.level}
              </div>
            ))}
          </div>
        </BrutalBlock>
      </div>
    </main>
  );
}
