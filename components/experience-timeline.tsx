"use client";

import { useState, type CSSProperties } from "react";
import { Plus } from "lucide-react";

import content from "@/app/profile-data.json";
import { parseRolePeriod, rulerYears } from "@/lib/role-period";
import { useInViewOnce } from "@/lib/use-in-view-once";

type ExperienceStep = {
  step: string;
  title: string;
  caption: string;
  period: string;
  current: boolean;
  description?: string;
  highlights?: string[];
  technologies?: string[];
};

/**
 * Experience as an index ledger: one row per role on a shared year ruler, with
 * a duration bar per role (orange while current). Hover or focus reveals the
 * description; activating a row unfolds an inverted panel with highlights and
 * tech, one row at a time.
 *
 * `now` comes from the server render (the home page revalidates daily) so
 * "Present" bars match between server HTML and hydration.
 */
export default function ExperienceTimeline({ now }: { now: number }) {
  const steps = content.experience.steps as ExperienceStep[];
  const today = new Date(now);
  const rows = steps.map((step) => ({ step, span: parseRolePeriod(step.period, today) }));
  const years = rulerYears(rows.flatMap(({ span }) => (span ? [span] : [])));
  const min = years[0] ?? 0;
  const max = years[years.length - 1] ?? 1;
  const toPercent = (year: number) => ((year - min) / (max - min || 1)) * 100;
  const currentCount = steps.filter((step) => step.current).length;

  const [openStep, setOpenStep] = useState<string | null>(null);
  const { ref, armed, inView } = useInViewOnce<HTMLDivElement>({ threshold: 0.2 });

  const ticks = (
    <>
      {years.map((year) => (
        <span
          key={year}
          aria-hidden="true"
          className="absolute inset-y-0 border-l border-dashed border-foreground/15"
          style={{ left: `${toPercent(year)}%` }}
        />
      ))}
    </>
  );

  return (
    <section id="experience" className="border-t border-foreground/35 py-12 sm:py-16">
      <div className="flex items-end justify-between gap-6 border-b border-foreground/35 pb-4">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
            {content.experience.eyebrow}
          </p>
          <h2 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Professional Timeline
          </h2>
        </div>
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted)">
          {currentCount} current · {steps.length} total
        </p>
      </div>

      <div ref={ref} className="ledger" data-armed={armed || undefined} data-in={inView || undefined}>
        {/* Ruler */}
        <div
          aria-hidden="true"
          className="ledger-grid grid items-end gap-x-6 border-b border-foreground/35 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-(--muted)"
        >
          <span className="hidden lg:block">Company</span>
          <span className="hidden lg:block">Role</span>
          <span className="relative h-4">
            {years.map((year, i) => (
              <span
                key={year}
                // End labels anchor inward so they never overhang the ruler.
                className={`absolute ${i === 0 ? "" : i === years.length - 1 ? "-translate-x-full" : "-translate-x-1/2"}`}
                style={{ left: `${toPercent(year)}%` }}
              >
                {year}
              </span>
            ))}
          </span>
          <span className="hidden lg:block" />
        </div>

        <ol>
          {rows.map(({ step, span }, index) => {
            const isOpen = openStep === step.step;
            const panelId = `role-${step.step}-details`;

            return (
              <li key={step.step} className="ledger-row border-b border-foreground/35" data-open={isOpen || undefined}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenStep(isOpen ? null : step.step)}
                  className="ledger-grid grid w-full items-center gap-x-6 gap-y-3 py-5 text-left transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <span className="col-start-1 row-start-1 text-lg font-extrabold leading-tight lg:col-auto lg:row-auto">
                    {step.caption}
                  </span>

                  <span className="col-span-2 lg:col-span-1">
                    <span className="block text-base font-medium">{step.title}</span>
                    <span className="mt-1 block font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-(--muted)">
                      {step.period}
                    </span>
                    {step.description && (
                      <span className="ledger-desc fold">
                        <span>
                          <span className="block pt-2 text-sm leading-relaxed text-(--muted)">{step.description}</span>
                        </span>
                      </span>
                    )}
                  </span>

                  <span className="relative col-span-2 h-2.5 lg:col-span-1" aria-hidden="true">
                    {ticks}
                    {span && (
                      <span
                        className={`ledger-bar ${span.ongoing ? "ledger-bar--now" : ""}`}
                        style={
                          {
                            left: `${toPercent(span.start)}%`,
                            width: `${toPercent(span.end) - toPercent(span.start)}%`,
                            "--r": index,
                          } as CSSProperties
                        }
                      />
                    )}
                  </span>

                  <span className="col-start-2 row-start-1 flex items-center justify-end gap-3 lg:col-auto lg:row-auto">
                    {step.current && (
                      <span className="border border-accent px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-accent">
                        Now
                      </span>
                    )}
                    <Plus className="ledger-plus h-4 w-4" aria-hidden="true" />
                  </span>
                </button>

                <div id={panelId} className="fold" data-open={isOpen || undefined} inert={!isOpen}>
                  <div>
                    <div className="mb-5 grid gap-6 bg-foreground p-6 text-background sm:p-7 lg:grid-cols-[1.4fr_1fr]">
                      {step.highlights && step.highlights.length > 0 && (
                        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-background/80">
                          {step.highlights.map((highlight) => (
                            <li key={highlight}>{highlight}</li>
                          ))}
                        </ul>
                      )}
                      {step.technologies && step.technologies.length > 0 && (
                        <ul className="flex flex-wrap content-start gap-2" aria-label={`${step.caption} technologies`}>
                          {step.technologies.map((tech) => (
                            <li
                              key={tech}
                              className="border border-background/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide"
                            >
                              {tech}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
