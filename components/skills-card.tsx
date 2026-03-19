import content from "@/app/profile-data.json";
import SectionCard from "./section-card";

export default function SkillsCard() {
  return (
    <SectionCard className="lg:col-start-3 lg:row-span-2">
      <div className="space-y-2.5">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--muted)]">
          {content.skills.eyebrow}
        </p>

        <div className="space-y-3">
          {content.skills.categories.map((category) => (
            <div key={category.name} className="space-y-2">
              <p className="text-xs font-semibold text-[color:var(--foreground)]">
                {category.name}
              </p>
              <ul className="space-y-1">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs text-[color:var(--muted)] sm:text-sm"
                  >
                    <span className="h-1 w-1 rounded-full bg-[color:var(--muted)]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
