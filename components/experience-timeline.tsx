import content from "@/app/profile-data.json";

export default function ExperienceTimeline() {
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
          {content.experience.steps.length} roles
        </p>
      </div>

      <ol className="relative ml-1 mt-8 border-l border-foreground/55 sm:ml-2 sm:mt-10">
        {content.experience.steps.map((item, index) => (
          <li
            key={item.step}
            className="relative grid gap-3 pb-9 pl-6 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8 sm:pl-7"
          >
            <span
              aria-hidden="true"
              className={`absolute -left-1.5 top-1 h-3 w-3 border border-foreground ${
                index === 0 ? "bg-foreground" : "bg-background"
              }`}
            />
            <div>
              <h3 className="text-xl font-bold leading-tight sm:text-2xl">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-(--muted) sm:text-base">
                {item.caption}
              </p>
            </div>
            <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted) sm:pt-1 sm:text-right">
              Role {item.step} / {String(content.experience.steps.length).padStart(2, "0")}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}