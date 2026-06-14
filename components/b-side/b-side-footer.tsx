"use client";

import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideFooter() {
  return (
    <BrutalBlock className="bs-fill-ink">
      <h2 className="bs-h" style={{ fontSize: "1.8rem" }}>LET&apos;S BUILD →</h2>
      <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>{content.footer.tagline}</p>
      <div className="bs-mono" style={{ fontSize: "0.72rem", marginTop: "0.7rem", display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
        {content.footer.quickLinks.map((l) => (
          <a key={l.label} href={l.href} style={{ color: "inherit" }}>{l.label}</a>
        ))}
      </div>
      <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent("b-side:exit"))}
          className="bs-tag bs-fill-pink"
        >
          ⏎ EXIT DIMENSION
        </button>
        <span className="bs-mono" style={{ fontSize: "0.66rem", opacity: 0.7 }}>
          or press ESC to return to the main universe
        </span>
      </div>
    </BrutalBlock>
  );
}
