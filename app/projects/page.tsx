import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import content from "@/app/profile-data.json";
import { SITE_URL } from "@/lib/site";
import ProjectsCatalog from "@/components/projects-catalog";

export const metadata: Metadata = {
  title: "Projects & Production Systems",
  description:
    "Selected engineering projects by Franze William Calleja, including enterprise web platforms, mobile systems, cloud infrastructure, and custom CMS architectures.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Projects & Production Systems | Franze William Calleja",
    description:
      "Selected engineering projects by Franze William Calleja, including enterprise web platforms, mobile systems, cloud infrastructure, and custom CMS architectures.",
    url: `${SITE_URL}/projects`,
    images: ["/og-image.png"],
  },
};

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-background px-5 pb-28 pt-5 sm:px-10 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-6 border-b border-foreground/35 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
              {content.projects.eyebrow} / Full index
            </p>
            <h1 className="mt-2 text-4xl font-black uppercase tracking-tight sm:text-5xl">
              All Projects
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-foreground/75 sm:text-lg">
              A selection of web, mobile, operations, and infrastructure work.
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex h-10 shrink-0 items-center gap-2 border border-foreground/60 px-4 font-mono text-xs font-bold uppercase tracking-[0.12em] transition-colors hover:border-foreground hover:bg-foreground hover:text-background sm:h-11 sm:px-5"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Home</span>
          </Link>
        </header>

        <ProjectsCatalog projects={content.projects.items} />
      </div>
    </main>
  );
}