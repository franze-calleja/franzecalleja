import Link from "next/link";
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

const FILLS = ["bs-fill-yellow", "bs-fill-cyan", "bs-fill-pink", ""];

export default function BSideStack() {
  return (
    <BrutalBlock>
      <div className="flex items-center justify-between">
        <span className="bs-idx">03 / STACK</span>
        <Link href="/b-side/stack" className="bs-tag">VIEW ALL →</Link>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.7rem" }}>
        {content.techstack.items.map((t, i) => (
          <span key={t.label} className={`bs-tag ${FILLS[i % FILLS.length]}`}>
            {t.label} {t.level}
          </span>
        ))}
      </div>
    </BrutalBlock>
  );
}
