import content from "@/app/profile-data.json";
import SectionCard from "./section-card";

export default function AboutCard() {
  return (
    <SectionCard className="lg:col-span-2" style={{ animationDelay: "90ms" }}>
      <div className="space-y-2.5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
            {content.about.eyebrow}
          </p>
          <h2 className="max-w-xl text-xl font-semibold tracking-tight sm:text-2xl">
            {content.about.title}
          </h2>
        </div>

        <div className="space-y-2.5">
          {content.about.body.map((paragraph) => (
            <p
              key={paragraph}
              className="max-w-2xl text-sm leading-6 text-(--muted) sm:text-[0.95rem]"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}