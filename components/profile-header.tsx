"use client";

import { useEffect, useState } from "react";
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
  const backImageSrc = content.profile.imageBack ?? "/icon.png";
  const [isTouchPointer, setIsTouchPointer] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");

    const updatePointerMode = () => {
      setIsTouchPointer(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setIsFlipped(false);
      }
    };

    updatePointerMode();
    mediaQuery.addEventListener("change", updatePointerMode);

    return () => {
      mediaQuery.removeEventListener("change", updatePointerMode);
    };
  }, []);

  return (
    <SectionCard className="w-full lg:p-6">
      <div className="relative flex flex-row items-stretch gap-3 sm:justify-between sm:gap-5">
        <div className="flex flex-1 items-stretch gap-3 pr-12 sm:gap-4 sm:pr-0">
          <button
            type="button"
            aria-pressed={isTouchPointer ? isFlipped : undefined}
            aria-label={`Show ${content.profile.name} icon`}
            onClick={() => {
              if (isTouchPointer) {
                setIsFlipped((current) => !current);
              }
            }}
            className={`flip-card h-full min-h-24 w-20 shrink-0 self-stretch overflow-hidden rounded-lg border border-(--border) shadow-sm sm:h-36 sm:w-36 ${
              isFlipped ? "is-flipped" : ""
            }`}
          >
            {/* overflow-hidden must NOT be here — it breaks preserve-3d; each face clips itself */}
            <div className="flip-card-inner">
              <div className="flip-card-front">
                <Image
                  src={content.profile.image}
                  alt={content.profile.name}
                  fill
                  sizes="(max-width: 640px) 5rem, 9rem"
                  className="object-cover"
                  priority
                />
              </div>

              <div className="flip-card-back bg-transparent">
                <Image
                  src={backImageSrc}
                  alt={`${content.profile.name} icon`}
                  fill
                  sizes="(max-width: 640px) 5rem, 9rem"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </button>

          <div className="min-w-0 flex-1 space-y-2.5 self-stretch sm:pt-1">
            <div className="space-y-1">
              <h1 className="text-lg font-semibold leading-tight tracking-tight sm:text-[1.7rem]">
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
                    aria-label={link.label}
                    className={
                      link.label === "Send email"
                        ? "inline-flex items-center justify-center gap-2 rounded-lg border border-(--border) bg-foreground px-2.5 py-1.5 text-background transition-colors sm:justify-start sm:px-3"
                        : "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-lg border border-(--border) px-2.5 py-1.5 text-foreground transition-colors sm:justify-start sm:px-3"
                    }
                  >
                    {link.label === "Send email" ? (
                      <>
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="hidden sm:inline">{link.label}</span>
                      </>
                    ) : (
                      <>
                        <span
                          className="absolute inset-0 z-0 -translate-x-full bg-foreground transition-transform duration-300 ease-out group-hover:translate-x-0"
                          aria-hidden="true"
                        />
                        <span className="relative z-10 inline-flex items-center gap-2 transition-colors group-hover:text-background">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="hidden sm:inline">{link.label}</span>
                        </span>
                      </>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 sm:static sm:ml-auto">
          <ThemeToggle />
        </div>
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
    <div className="flex items-center gap-2 text-[0.7rem] text-(--muted) sm:text-sm">
      <span className="text-(--foreground)/80">
        <Icon className="h-4 w-4" />
      </span>
      <span>{text}</span>
    </div>
  );
}
