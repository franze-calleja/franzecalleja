import { Award, GraduationCap, Trophy } from "lucide-react";

import content from "@/app/profile-data.json";

export default function EducationSection() {
  const education = content.education.items[0];
  const honorsList = (education as { honorsList?: string[] }).honorsList ?? [
    "Magna Cum Laude",
    "Class Salutatorian",
  ];
  const focusAreas = (education as { focusAreas?: string[] }).focusAreas ?? [
    "Software Architecture & Design",
    "Algorithms & Complexity",
    "Distributed Systems",
    "Database Engineering",
    "Enterprise Application Systems",
  ];

  return (
    <section id="education" className="border-t border-foreground/35 py-12 sm:py-16">
      {/* Section Header */}
      <div className="border-b border-foreground/35 pb-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
          {content.education.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Academic Background
        </h2>
      </div>

      {/* Unified Academic Credential Card */}
      <article className="group mt-8 border border-foreground/55 p-6 transition-all duration-300 hover:border-foreground hover:shadow-xl sm:p-8 lg:p-10">
        {/* Top bar with Distinction badges and graduation period */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-foreground/20 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            {honorsList.map((honor, idx) => (
              <span
                key={honor}
                className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider ${
                  idx === 0
                    ? "border border-foreground bg-foreground text-background"
                    : "border border-foreground/45 text-foreground"
                }`}
              >
                {idx === 0 ? (
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {honor}
              </span>
            ))}
          </div>

          <span className="flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted)">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            {education.year}
          </span>
        </div>

        {/* Degree & Institution */}
        <div className="mt-6">
          <h3 className="text-2xl font-black uppercase leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {education.degree}
          </h3>
          <p className="mt-2 font-mono text-sm font-semibold uppercase tracking-[0.08em] text-(--muted) sm:text-base">
            {education.institution}
          </p>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-foreground/85 sm:text-lg">
            {education.description}
          </p>
        </div>

        {/* Academic Focus & Coursework Competencies */}
        <div className="mt-8 border-t border-foreground/20 pt-6">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)">
            Academic Focus & Core Competencies
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Academic competencies">
            {focusAreas.map((area) => (
              <li key={area}>
                <span className="inline-block border border-foreground/35 px-3 py-1 font-mono text-xs font-semibold text-foreground/90 transition-all duration-200 hover:border-foreground hover:bg-foreground hover:text-background">
                  {area}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  );
}