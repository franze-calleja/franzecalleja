import { ArrowUpRight, Github, Linkedin, Instagram } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

import content from "@/app/profile-data.json";
import SectionCard from "./section-card";

type IconType = ComponentType<SVGProps<SVGSVGElement>>;
const ICONS: Record<string, IconType> = {
  github: Github,
  linkedin: Linkedin,
  instagram: Instagram,
};

export default function FooterCard() {
  return (
    <SectionCard className="lg:col-span-3" style={{ animationDelay: "930ms" }}>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-(--muted)">
              {content.footer.eyebrow}
            </p>
            <p className="max-w-xl text-sm leading-relaxed text-foreground sm:text-base">
              {content.footer.tagline}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {content.footer.social.map((s: { label: string; href: string; icon: string }) => {
              const Icon = ICONS[s.icon] ?? ArrowUpRight as IconType;
              return (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-(--border) px-3 py-1 text-xs text-(--muted) transition-colors hover:bg-(--hover) hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  <span>{s.label}</span>
                </a>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-(--border) pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-(--muted)">{content.profile.location}</div>

          <p className="text-xs text-(--muted)">
            © {new Date().getFullYear()} {content.profile.name}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}