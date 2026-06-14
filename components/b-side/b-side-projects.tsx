import Link from "next/link";
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

const PREVIEW_COUNT = 3;

export default function BSideProjects() {
  const preview = content.projects.items.slice(0, PREVIEW_COUNT);
  return (
    <BrutalBlock className="bs-fill-pink">
      <div className="flex items-center justify-between">
        <span className="bs-idx">05 / PROJECTS</span>
        <Link href="/b-side/projects" className="bs-tag">VIEW ALL →</Link>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.7rem", marginTop: "0.7rem" }}
      >
        {preview.map((p) => (
          <a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noreferrer"
            style={{ border: "2px solid #0E100F", background: "#f3efdd", color: "#0E100F", padding: "0.7rem", textDecoration: "none", display: "block" }}
          >
            <strong style={{ fontSize: "0.85rem" }}>{p.name}</strong>
            <p style={{ fontSize: "0.72rem", margin: "0.4rem 0", lineHeight: 1.4 }}>{p.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
              {p.technologies.map((t) => (
                <span key={t} className="bs-mono" style={{ fontSize: "0.62rem", border: "1px solid #0E100F", padding: "0.1rem 0.35rem" }}>
                  {t}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>
    </BrutalBlock>
  );
}
