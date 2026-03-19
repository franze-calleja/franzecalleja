import content from "@/app/profile-data.json";
import SectionCard from "./section-card";

export default function EducationCard() {
  return (
    <SectionCard>
      <div className="space-y-2.5">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
          {content.education.eyebrow}
        </p>
        <div className="space-y-4">
          {content.education.items.map((item) => (
            <div key={item.degree} className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {item.degree}
              </p>
              <p className="text-xs text-(--muted)">{item.institution}</p>
              <p className="text-xs text-(--muted)">{item.year}</p>
              {item.honors && (
                <p className="text-xs font-medium text-foreground">
                  {item.honors}
                </p>
              )}
              {item.description && (
                <p className="pt-1 text-xs leading-relaxed text-(--muted) sm:text-sm">
                  {item.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
