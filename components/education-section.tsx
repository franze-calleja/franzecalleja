import content from "@/app/profile-data.json";

export default function EducationSection() {
  const education = content.education.items[0];
  const achievements = education.honors.split(", ");

  return (
    <section id="education" className="border-t border-foreground/35 py-12 sm:py-16">
      <div className="border-b border-foreground/35 pb-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
          {content.education.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Education
        </h2>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)] lg:gap-8">
        <article className="border border-foreground/55 p-6 sm:p-7">
          <h3 className="text-2xl font-bold leading-tight sm:text-3xl">{education.degree}</h3>
          <p className="mt-3 text-sm leading-6 text-(--muted) sm:text-base">
            {education.institution}{" // "}{education.year}
          </p>
          <p className="mt-6 max-w-2xl text-base leading-7 text-foreground/80">
            {education.description}
          </p>
        </article>

        <article className="border border-foreground/55 p-6 sm:p-7">
          <p className="border-b border-foreground/35 pb-3 font-mono text-xs font-semibold uppercase tracking-[0.12em]">
            Achievements
          </p>
          <ul className="mt-5 space-y-3">
            {achievements.map((achievement) => (
              <li key={achievement} className="flex gap-3 text-sm leading-6 sm:text-base">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-foreground" aria-hidden="true" />
                {achievement}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}