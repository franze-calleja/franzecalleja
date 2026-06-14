import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideAvailability() {
  return (
    <BrutalBlock className="bs-fill-cyan">
      <span className="bs-idx">08 / AVAILABILITY</span>
      <div style={{ marginTop: "0.8rem", fontWeight: 700, fontSize: "1.5rem", letterSpacing: "-0.03em", lineHeight: 1 }}>
        ● {content.availability.status.toUpperCase()}
      </div>
      <p style={{ fontSize: "0.82rem", marginTop: "0.7rem", lineHeight: 1.6 }}>
        {content.availability.description}
      </p>
      <a
        href={content.availability.contactHref}
        className="bs-tag bs-fill-ink"
        style={{ marginTop: "0.9rem", display: "block", textAlign: "center", padding: "0.55rem 0.8rem" }}
      >
        GET IN TOUCH →
      </a>
    </BrutalBlock>
  );
}
