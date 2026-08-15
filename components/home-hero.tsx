import Image from "next/image";
import { Github, Link as LinkIcon, Linkedin, Mail } from "lucide-react";

import content from "@/app/profile-data.json";
import ThemeToggle from "@/components/theme-toggle";

const iconMap = {
  mail: Mail,
  github: Github,
  linkedin: Linkedin,
} as const;

export default function HomeHero() {
  return (
    <>
      <header className="flex items-center justify-between border-b border-foreground/20 pb-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">
          FWC / 2026
        </p>
        <ThemeToggle />
      </header>

      <section className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)] lg:gap-16 lg:py-14">
        <div className="max-w-3xl">
          <p className="mb-4 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
            {content.profile.location} / Available for select work
          </p>
          <h1 className="text-5xl font-black leading-[0.9] tracking-tight sm:text-6xl lg:text-7xl">
            {content.profile.name.toUpperCase()}
          </h1>
          <p className="mt-5 text-xl font-semibold uppercase tracking-[0.03em] sm:text-2xl">
            {content.profile.role}
          </p>
          <p className="mt-8 max-w-2xl border-l-2 border-foreground pl-4 text-base leading-7 text-foreground/80 sm:text-lg">
            {content.about.body[0]}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            {content.links.map((link) => {
              const Icon = iconMap[link.icon as keyof typeof iconMap] ?? LinkIcon;
              const isEmail = link.icon === "mail";

              return (
                <a
                  key={link.label}
                  href={link.href}
                  target={isEmail ? undefined : "_blank"}
                  rel={isEmail ? undefined : "noreferrer"}
                  className={`inline-flex h-12 items-center gap-2 border px-4 text-xs font-bold uppercase tracking-[0.12em] transition-colors ${
                    isEmail
                      ? "border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground"
                      : "border-foreground/55 hover:border-foreground hover:bg-foreground hover:text-background"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {link.label}
                </a>
              );
            })}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative aspect-[4/5] border border-foreground/70 bg-foreground/8 p-3 sm:p-4">
            <div className="absolute left-[-0.2rem] top-[-0.2rem] h-5 w-5 border-l-2 border-t-2 border-foreground" />
            <div className="absolute right-[-0.2rem] top-[-0.2rem] h-5 w-5 border-r-2 border-t-2 border-foreground" />
            <div className="absolute bottom-[-0.2rem] left-[-0.2rem] h-5 w-5 border-b-2 border-l-2 border-foreground" />
            <div className="absolute bottom-[-0.2rem] right-[-0.2rem] h-5 w-5 border-b-2 border-r-2 border-foreground" />
            <div className="relative h-full overflow-hidden bg-foreground">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-2/5 p-3 font-mono text-[0.55rem] leading-4 text-background/55 sm:p-5 sm:text-[0.65rem]">
                &lt;build /&gt;<br />
                stack: react<br />
                services: node<br />
                infra: cloud<br />
                status: online<br />
                deploy: ready
              </div>
              <Image
                src={content.profile.image}
                alt={content.profile.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 38vw"
                className="object-cover object-[56%_center] grayscale contrast-125"
              />
              <div className="absolute inset-0 bg-linear-to-r from-foreground/40 via-transparent to-transparent" />
              <span className="absolute bottom-3 right-3 border border-background/70 bg-background px-2 py-1 font-mono text-[0.6rem] font-semibold uppercase text-foreground">
                SYS.ARCH // PH
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}