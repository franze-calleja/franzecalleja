import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideAvailability() {
  return (
    <BrutalBlock className="bs-fill-ink">
      <span className="bs-idx" style={{ background: "#00e0c6", color: "#0E100F" }}>
        08 / AVAILABILITY
      </span>
      <div style={{ marginTop: "0.6rem" }}>
        <span className="bs-tag bs-fill-cyan">● {content.availability.status.toUpperCase()}</span>
      </div>
      <p style={{ fontSize: "0.82rem", marginTop: "0.6rem" }}>
        {content.availability.description}
      </p>
      <a href={content.availability.contactHref} className="bs-tag bs-fill-yellow" style={{ marginTop: "0.6rem" }}>
        GET IN TOUCH →
      </a>
    </BrutalBlock>
  );
}
