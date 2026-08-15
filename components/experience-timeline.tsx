import content from "@/app/profile-data.json";

export default function ExperienceTimeline() {
  const currentRoles = content.experience.steps.filter((item) => item.current);
  const previousRoles = content.experience.steps.filter((item) => !item.current);

  return (
    <section id="experience" className="border-t border-foreground/35 py-12 sm:py-16">
      <div className="flex items-end justify-between gap-6 border-b border-foreground/35 pb-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
            {content.experience.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Experience
          </h2>
        </div>
        <p className="hidden font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted) sm:block">
          {currentRoles.length} current roles
        </p>
      </div>

      <section className="mt-8" aria-labelledby="current-roles-heading">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 bg-foreground" aria-hidden="true" />
          <h3 id="current-roles-heading" className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">
            Current Roles
          </h3>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {currentRoles.map((item) => (
            <article key={item.step} className="flex min-h-44 flex-col border border-foreground/55 p-6 sm:p-7">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted)">
                {item.period}
              </p>
              <h4 className="mt-4 text-xl font-bold leading-tight sm:text-2xl">{item.title}</h4>
              <p className="mt-3 text-sm leading-6 text-(--muted) sm:text-base">{item.caption}</p>
              <p className="mt-auto pt-5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground">
                Active
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="previous-roles-heading">
        <h3 id="previous-roles-heading" className="border-b border-foreground/35 pb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)">
          Previous Roles
        </h3>
        <ol className="relative ml-1 mt-6 border-l border-foreground/55 sm:ml-2">
          {previousRoles.map((item) => (
          <li
            key={item.step}
            className="relative grid gap-3 pb-9 pl-6 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8 sm:pl-7"
          >
            <span
              aria-hidden="true"
              className="absolute -left-1.5 top-1 h-3 w-3 border border-foreground bg-background"
            />
            <div>
              <h4 className="text-xl font-bold leading-tight sm:text-2xl">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-(--muted) sm:text-base">
                {item.caption}
              </p>
            </div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted) sm:pt-1 sm:text-right">
              {item.period}
            </p>
          </li>
          ))}
        </ol>
      </section>
    </section>
  );
}