import Link from "next/link";
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

function bar(level: number) {
  const filled = Math.round(level / 12.5); // 0..8 blocks
  return "█".repeat(filled) + " ".repeat(8 - filled);
}

export default function BSideSkills() {
  return (
    <BrutalBlock className="bs-fill-ink">
      <div className="flex items-center justify-between">
        <span className="bs-idx" style={{ background: "#ffe600", color: "#0E100F" }}>
          04 / SKILLS
        </span>
        <Link href="/b-side/stack" className="bs-tag" style={{ color: "#0E100F" }}>
          VIEW ALL →
        </Link>
      </div>
      <div className="bs-mono" style={{ marginTop: "0.7rem", fontSize: "0.8rem", lineHeight: 2 }}>
        {content.skills.overall.map((s) => (
          <div key={s.label} style={{ whiteSpace: "pre" }}>
            {s.label.toUpperCase().padEnd(10, " ")} [{bar(s.level)}] {s.level}
          </div>
        ))}
      </div>
    </BrutalBlock>
  );
}
