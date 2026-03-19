import content from "@/app/profile-data.json";
import SectionCard from "./section-card";

export default function ExperienceCard() {
  return (
    <SectionCard style={{ animationDelay: "180ms" }}>
      <div className="space-y-2.5">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
            {content.experience.eyebrow}
          </p>
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
            {content.experience.title}
          </h2>
        </div>

        <div className="relative pt-0.5">
          <div className="absolute bottom-8 left-4 top-4 w-px bg-(--border)" />

          <div className="space-y-3">
            {content.experience.steps.map((item) => (
              <div
                key={item.step}
                className="relative flex items-start gap-3.5 pl-9 group rounded-md transition-all hover:shadow-sm overflow-hidden min-h-10"
              >
                {/* sliding overlay */}
                <span className="absolute inset-0 z-0 transform -translate-x-full bg-(--hover) transition-transform duration-300 ease-out group-hover:translate-x-0" aria-hidden="true" />

                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-sm border border-(--border) bg-(--surface) transform transition-all group-hover:scale-105 z-10">
                  <div className="h-2.5 w-2.5 rounded-sm bg-(--muted) transition-colors group-hover:bg-foreground" />
                </div>

                <div className="space-y-1 pt-0.5 text-left z-10">
                  <p className="text-xs font-medium sm:text-sm group-hover:text-foreground">
                    {item.title}
                  </p>
                  <p className="text-[0.7rem] text-(--muted) sm:text-xs group-hover:text-foreground">
                    {item.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}