import content from "@/app/profile-data.json";
import ThemeToggle from "@/components/theme-toggle";
import BrutalBlock from "./brutal-block";

export default function BSideHero() {
  return (
    <BrutalBlock className="bs-fill-yellow">
      <div className="flex items-start justify-between gap-3">
        <span className="bs-tag bs-fill-pink" style={{ transform: "rotate(-3deg)" }}>
          ⚡ DIMENSION: B-SIDE
        </span>
        <ThemeToggle />
      </div>

      <h1 className="bs-hero-name" style={{ marginTop: "1rem" }}>
        {content.profile.name.toUpperCase()}
      </h1>

      <span
        className="bs-tag bs-fill-cyan"
        style={{ marginTop: "0.75rem", fontSize: "0.85rem" }}
      >
        {content.profile.role.toUpperCase()}
      </span>

      <div className="bs-mono" style={{ marginTop: "0.85rem", fontSize: "0.8rem" }}>
        ● {content.profile.location} &nbsp; ● {content.availability.status}
      </div>

      <div style={{ marginTop: "0.9rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {content.links.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.label === "Send email" ? undefined : "_blank"}
            rel={link.label === "Send email" ? undefined : "noreferrer"}
            className={`bs-tag ${link.label === "Send email" ? "bs-fill-ink" : ""}`}
          >
            {link.label.toUpperCase()}
          </a>
        ))}
      </div>
    </BrutalBlock>
  );
}
