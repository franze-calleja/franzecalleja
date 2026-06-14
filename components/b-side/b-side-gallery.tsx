import Image from "next/image";
import content from "@/app/profile-data.json";
import BrutalBlock from "./brutal-block";

const GALLERY_PREVIEW = 4;

export default function BSideGallery() {
  const preview = content.gallery.items.slice(0, GALLERY_PREVIEW);
  return (
    <BrutalBlock>
      <span className="bs-idx">09 / GALLERY</span>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginTop: "0.7rem" }}
      >
        {preview.map((g) => (
          <div
            key={g.label}
            style={{ border: "3px solid var(--foreground)", boxShadow: "var(--bs-shadow-sm)", aspectRatio: "1", position: "relative", overflow: "hidden" }}
          >
            <Image src={g.image} alt={g.title} fill sizes="(min-width: 768px) 200px, 45vw" style={{ objectFit: "cover" }} />
            <span
              className="bs-mono"
              style={{ position: "absolute", left: 4, top: 4, background: "#0E100F", color: "#f3efdd", fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}
            >
              {g.label}
            </span>
          </div>
        ))}
      </div>
    </BrutalBlock>
  );
}
