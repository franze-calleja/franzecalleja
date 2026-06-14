import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideEducation() {
  return (
    <BrutalBlock>
      <span className="bs-idx">06 / EDUCATION</span>
      {content.education.items.map((e) => (
        <div key={e.degree} style={{ marginTop: "0.6rem" }}>
          <strong style={{ fontSize: "0.95rem" }}>{e.degree}</strong>
          <p className="bs-mono" style={{ fontSize: "0.72rem", margin: "0.4rem 0", lineHeight: 1.5 }}>
            {e.institution} · {e.year}
            <br />
            {e.honors}
          </p>
          <p style={{ fontSize: "0.78rem", margin: 0 }}>{e.description}</p>
        </div>
      ))}
    </BrutalBlock>
  );
}
