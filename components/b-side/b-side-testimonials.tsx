import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

export default function BSideTestimonials() {
  return (
    <BrutalBlock className="bs-fill-cyan">
      <span className="bs-idx">07 / TESTIMONIALS</span>
      {content.testimonials.items.map((t) => (
        <figure key={t.name} style={{ margin: "0.6rem 0 0" }}>
          <blockquote style={{ fontSize: "0.9rem", fontStyle: "italic", margin: 0 }}>
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <figcaption className="bs-mono" style={{ fontSize: "0.72rem", marginTop: "0.5rem" }}>
            — {t.name}, {t.role}
          </figcaption>
        </figure>
      ))}
    </BrutalBlock>
  );
}
