import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideExperience() {
  return (
    <BrutalBlock className="bs-fill-violet">
      <span className="bs-idx" style={{ background: "#fff", color: "#0E100F" }}>
        02 / EXPERIENCE
      </span>
      <div style={{ display: "grid", gap: "0.55rem", marginTop: "0.7rem" }}>
        {content.experience.steps.map((s) => (
          <div
            key={s.step}
            style={{
              background: "rgba(0,0,0,0.15)",
              borderLeft: "3px solid #fff",
              padding: "0.55rem 0.7rem",
              display: "grid",
              gridTemplateColumns: "auto 1fr",
              gap: "0.6rem",
              alignItems: "center",
            }}
          >
            <span
              className="bs-mono"
              style={{ fontSize: "0.62rem", fontWeight: 700, background: "#fff", color: "#0E100F", padding: "0.1rem 0.35rem", alignSelf: "start", marginTop: "0.1rem" }}
            >
              {s.step}
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", lineHeight: 1.2 }}>{s.title}</div>
              <div className="bs-mono" style={{ fontSize: "0.68rem", marginTop: "0.2rem", opacity: 0.8 }}>{s.caption}</div>
            </div>
          </div>
        ))}
      </div>
    </BrutalBlock>
  );
}
