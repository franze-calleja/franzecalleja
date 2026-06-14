import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideSkills() {
  return (
    <BrutalBlock className="bs-fill-ink">
      <span className="bs-idx" style={{ background: "#ffe600", color: "#0E100F" }}>
        04 / SKILLS
      </span>
      <div style={{ marginTop: "0.7rem", display: "grid", gap: "0.65rem" }}>
        {content.skills.overall.map((s) => (
          <div key={s.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <span className="bs-mono" style={{ fontSize: "0.7rem", fontWeight: 700 }}>{s.label.toUpperCase()}</span>
              <span className="bs-mono" style={{ fontSize: "0.7rem", opacity: 0.7 }}>{s.level}</span>
            </div>
            <div style={{ height: "5px", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}>
              <div style={{ height: "100%", width: `${s.level}%`, background: "#ffe600" }} />
            </div>
          </div>
        ))}
      </div>
    </BrutalBlock>
  );
}
