"use client";

import Link from "next/link";
import content from "@/app/profile-data.json";
import { useGsapReveal } from "@/components/b-side/use-gsap-reveal";
import BrutalBlock from "@/components/b-side/brutal-block";

export default function BSideProjectsPage() {
  const ref = useGsapReveal<HTMLDivElement>();
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
      <div className="flex items-center justify-between" style={{ marginBottom: "1rem" }}>
        <h1 className="bs-h" style={{ fontSize: "2rem" }}>ALL PROJECTS</h1>
        <Link href="/b-side" className="bs-tag">← BACK</Link>
      </div>
      <div ref={ref} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
        {content.projects.items.map((p) => (
          <BrutalBlock key={p.name}>
            <strong style={{ fontSize: "0.95rem" }}>{p.name}</strong>
            <p style={{ fontSize: "0.8rem", margin: "0.5rem 0", lineHeight: 1.5 }}>{p.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.6rem" }}>
              {p.technologies.map((t) => (
                <span key={t} className="bs-tag" style={{ fontSize: "0.6rem" }}>{t}</span>
              ))}
            </div>
            <a href={p.href} target="_blank" rel="noreferrer" className="bs-tag bs-fill-yellow">OPEN →</a>
          </BrutalBlock>
        ))}
      </div>
    </main>
  );
}
