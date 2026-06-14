import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideAbout() {
  return (
    <BrutalBlock>
      <span className="bs-idx">01 / ABOUT</span>
      <h2 className="bs-h" style={{ fontSize: "1.4rem", margin: "0.6rem 0 0.6rem" }}>
        {content.about.title}
      </h2>
      <div style={{ display: "grid", gap: "0.6rem" }}>
        {content.about.body.map((para, i) => (
          <p key={i} style={{ fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
            {para}
          </p>
        ))}
      </div>
    </BrutalBlock>
  );
}
