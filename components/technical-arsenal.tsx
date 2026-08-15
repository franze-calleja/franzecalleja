import content from "@/app/profile-data.json";

const selectTechnologies = (labels: string[]) =>
  content.techstack.items
    .filter((item) => labels.includes(item.label))
    .map((item) => item.label);

const aiAndInfrastructure =
  content.skills.categories.find((category) => category.name === "AI & Infrastructure")?.items.map(
    (item) => item.label,
  ) ?? [];

const arsenalGroups = [
  {
    title: "Frontend",
    items: selectTechnologies(["TypeScript", "React", "Next.js", "Tailwind CSS"]),
  },
  {
    title: "Backend",
    items: selectTechnologies(["Node.js", "Express.js", "Prisma", "PHP", "Axum"]),
  },
  {
    title: "Data & Infrastructure",
    items: selectTechnologies(["MySQL", "PostgreSQL", "Docker", "Git"]),
  },
  {
    title: "AI & Infrastructure",
    items: aiAndInfrastructure,
  },
];

export default function TechnicalArsenal() {
  return (
    <section id="technical-arsenal" className="border-t border-foreground/35 py-12 sm:py-16">
      <div className="border-b border-foreground/35 pb-4">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
          {content.techstack.eyebrow}
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
          Technical Arsenal
        </h2>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-7">
        {arsenalGroups.map((group) => (
          <article key={group.title} className="border border-foreground/55 p-6 sm:p-7">
            <h3 className="border-b border-foreground/35 pb-3 font-mono text-xs font-semibold uppercase tracking-[0.1em]">
              {group.title}
            </h3>
            <ul className="mt-5 flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item} className="border border-foreground/55 px-2.5 py-1 font-mono text-xs font-semibold">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}