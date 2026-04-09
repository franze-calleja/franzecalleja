import Link from "next/link";

import content from "@/app/profile-data.json";
import SectionCard from "./section-card";
import { ArrowUpRight } from "lucide-react";

export default function SkillsCard() {
  return (
    <SectionCard className="lg:col-start-3 lg:row-span-2" style={{ animationDelay: "390ms" }}>
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
            {content.skills.eyebrow}
          </p>
          <Link
            href={content.skills.viewAllHref ?? "/stack"}
            className="inline-flex items-center gap-1 text-xs font-medium text-(--muted) transition-colors hover:text-foreground"
          >
            View all
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {content.skills.categories.map((category) => (
            <div key={category.name} className="space-y-2">
              <p className="text-xs font-semibold text-foreground">
                {category.name}
              </p>
              <ul className="space-y-1">
                {category.items.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 text-xs text-(--muted) sm:text-sm"
                  >
                    <span className="h-1 w-1 rounded-full bg-(--muted)" aria-hidden="true" />
                    {item.label}
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
