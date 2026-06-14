import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideExperience() {
  return (
    <BrutalBlock className="bs-fill-violet">
      <span className="bs-idx" style={{ background: "#fff", color: "#0E100F" }}>
        02 / EXPERIENCE
      </span>
      <ul
        className="bs-mono"
        style={{ listStyle: "none", padding: 0, margin: "0.7rem 0 0", display: "grid", gap: "0.45rem", fontSize: "0.82rem" }}
      >
        {content.experience.steps.map((s) => (
          <li key={s.step}>
            {s.step} → <strong>{s.title}</strong> · {s.caption}
          </li>
        ))}
      </ul>
    </BrutalBlock>
  );
}
