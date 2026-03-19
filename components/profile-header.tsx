import Image from "next/image";
import { Briefcase, Github, Linkedin, Mail, MapPin } from "lucide-react";

import content from "@/app/profile-data.json";
import SectionCard from "./section-card";
import ThemeToggle from "./theme-toggle";

const iconMap = {
  mail: Mail,
  github: Github,
  linkedin: Linkedin,
} as const;

export default function ProfileHeader() {
  return (
    <SectionCard className="w-full lg:p-6">
      <div className="flex items-start justify-between gap-4 sm:gap-5">
        <div className="flex flex-1 items-start gap-3.5 sm:gap-4">
          <Image
            src={content.profile.image}
            alt={content.profile.name}
            width={148}
            height={148}
            className="h-36 w-36 rounded-lg border border-[color:var(--border)] object-cover shadow-sm"
            priority
          />

          <div className="space-y-2.5 pt-1">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.7rem]">
                {content.profile.name}
              </h1>

              <DetailRow icon={MapPin} text={content.profile.location} />
              <DetailRow icon={Briefcase} text={content.profile.role} />
            </div>

            <div className="flex flex-wrap gap-2 pt-1 text-xs font-medium sm:text-sm">
              {content.links.map((link) => {
                const Icon = iconMap[link.icon as keyof typeof iconMap];

                return (
                  <a
                    key={link.label}
                    href={link.href}
                    target={link.label === "Send email" ? undefined : "_blank"}
                    rel={link.label === "Send email" ? undefined : "noreferrer"}
                    className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--hover)]"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <ThemeToggle />
      </div>
    </SectionCard>
  );
}

function DetailRow({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[0.7rem] text-[color:var(--muted)] sm:text-sm">
      <span className="text-[color:var(--foreground)]/80">
        <Icon className="h-4 w-4" />
      </span>
      <span>{text}</span>
    </div>
  );
}