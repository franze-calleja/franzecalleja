"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, Plus, X } from "lucide-react";

import content from "@/app/profile-data.json";

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

export default function ExperienceTimeline() {
  const steps = content.experience.steps as ExperienceStep[];
  const currentRoles = steps.filter((item) => item.current);
  const previousRoles = steps.filter((item) => !item.current);

  const [selectedRole, setSelectedRole] = useState<ExperienceStep | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [expandedPrevious, setExpandedPrevious] = useState<Record<string, boolean>>({});

  const togglePreviousRole = (stepKey: string) => {
    setExpandedPrevious((prev) => ({
      ...prev,
      [stepKey]: !prev[stepKey],
    }));
  };

  const closeModal = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setSelectedRole(null);
      setIsClosing(false);
    }, 200);
  }, []);

  const openModal = (role: ExperienceStep) => {
    setIsClosing(false);
    setSelectedRole(role);
  };

  // Close modal on Escape key and lock body scroll
  useEffect(() => {
    if (!selectedRole) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedRole, closeModal]);

  return (
    <section id="experience" className="border-t border-foreground/35 py-12 sm:py-16">
      {/* Section Header */}
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
          {currentRoles.length} active roles
        </p>
      </div>

      {/* Current Roles Grid */}
      <section className="mt-8" aria-labelledby="current-roles-heading">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 bg-foreground" aria-hidden="true" />
          <h3 id="current-roles-heading" className="font-mono text-xs font-semibold uppercase tracking-[0.14em]">
            Current Roles
          </h3>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {currentRoles.map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => openModal(item)}
              className="group relative flex min-h-64 flex-col border border-foreground/55 p-6 text-left transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-foreground hover:bg-foreground hover:text-background hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground sm:p-7"
            >
              {/* Top metadata */}
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted) transition-colors duration-200 group-hover:text-background/70">
                  {item.period}
                </p>
                <ArrowUpRight
                  className="h-4 w-4 shrink-0 text-(--muted) transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-background"
                  aria-hidden="true"
                />
              </div>

              {/* Title & Company */}
              <h4 className="mt-3 text-xl font-bold leading-tight sm:text-2xl">
                {item.title}
              </h4>
              <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-(--muted) transition-colors duration-200 group-hover:text-background/70">
                {item.caption}
              </p>

              {/* Brief description */}
              {item.description && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/80 transition-colors duration-200 group-hover:text-background/90">
                  {item.description}
                </p>
              )}

              {/* Tech stack pills */}
              {item.technologies && item.technologies.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {item.technologies.slice(0, 4).map((tech) => (
                    <span
                      key={tech}
                      className="border border-foreground/35 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide transition-all duration-200 group-hover:border-background/40 group-hover:bg-background/10 group-hover:text-background"
                    >
                      {tech}
                    </span>
                  ))}
                  {item.technologies.length > 4 && (
                    <span className="px-1 py-0.5 font-mono text-[10px] text-(--muted) transition-colors duration-200 group-hover:text-background/70">
                      +{item.technologies.length - 4}
                    </span>
                  )}
                </div>
              )}

              {/* Bottom status */}
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors duration-200 group-hover:text-background">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" aria-hidden="true" />
                  Active
                </span>
                <span className="font-mono text-xs text-(--muted) underline decoration-dashed underline-offset-4 transition-colors duration-200 group-hover:text-background/80">
                  View details
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Previous Roles Timeline */}
      <section className="mt-12" aria-labelledby="previous-roles-heading">
        <h3
          id="previous-roles-heading"
          className="border-b border-foreground/35 pb-3 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)"
        >
          Previous Roles
        </h3>

        <ol className="relative ml-1 mt-6 border-l border-foreground/55 sm:ml-2">
          {previousRoles.map((item) => {
            const isExpanded = !!expandedPrevious[item.step];

            return (
              <li
                key={item.step}
                className="relative pb-8 pl-6 last:pb-2 sm:pl-8"
              >
                {/* Node indicator */}
                <span
                  aria-hidden="true"
                  className={`absolute -left-1.5 top-1.5 h-3 w-3 border border-foreground transition-all duration-300 ease-out ${
                    isExpanded
                      ? "rotate-45 scale-110 bg-foreground"
                      : "rotate-0 scale-100 bg-background"
                  }`}
                />

                {/* Timeline Header Button */}
                <button
                  type="button"
                  onClick={() => togglePreviousRole(item.step)}
                  aria-expanded={isExpanded}
                  className="group flex w-full flex-col items-start justify-between gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h4 className="text-xl font-bold leading-tight transition-colors duration-200 group-hover:text-foreground group-hover:underline sm:text-2xl">
                        {item.title}
                      </h4>
                      <span
                        className={`inline-flex h-5 w-5 items-center justify-center border font-mono text-xs transition-all duration-300 ease-out ${
                          isExpanded
                            ? "border-foreground bg-foreground text-background"
                            : "border-foreground/40 text-(--muted) group-hover:border-foreground group-hover:text-foreground"
                        }`}
                      >
                        <Plus
                          className={`h-3 w-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                            isExpanded ? "rotate-45" : "rotate-0"
                          }`}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-(--muted)">
                      {item.caption}
                    </p>
                  </div>

                  <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted) sm:text-right">
                    {item.period}
                  </p>
                </button>

                {/* Smooth Accordion Body */}
                <div
                  className={`timeline-accordion ${
                    isExpanded ? "timeline-accordion--open" : ""
                  }`}
                >
                  <div className="timeline-accordion__inner">
                    <div className="timeline-accordion__content border-l-2 border-foreground/40 pl-4 text-sm leading-relaxed sm:pl-5">
                      {item.description && (
                        <p className="text-foreground/85">{item.description}</p>
                      )}

                      {item.highlights && item.highlights.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {item.highlights.map((highlight, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-foreground/80"
                            >
                              <span
                                className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-foreground/60"
                                aria-hidden="true"
                              />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {item.technologies && item.technologies.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {item.technologies.map((tech) => (
                            <span
                              key={tech}
                              className="border border-foreground/35 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-foreground/80 transition-colors hover:border-foreground"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Role Detail Modal / Bottom Drawer */}
      {selectedRole && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-modal-title"
          className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6"
        >
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 ${
              isClosing ? "opacity-0" : "animate-modal-backdrop"
            }`}
            onClick={closeModal}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <div
            className={`relative z-80 flex max-h-[88vh] w-full max-w-2xl flex-col border border-foreground bg-background p-6 shadow-2xl transition-all duration-200 sm:p-8 ${
              isClosing
                ? "translate-y-3 scale-95 opacity-0"
                : "animate-modal-card"
            }`}
          >
            {/* Header / Close */}
            <div className="flex items-start justify-between gap-4 border-b border-foreground/30 pb-4">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-(--muted)">
                  {selectedRole.current ? "Current Role" : "Previous Role"} / {selectedRole.caption}
                </p>
                <h3
                  id="role-modal-title"
                  className="mt-2 text-2xl font-black uppercase tracking-tight sm:text-3xl"
                >
                  {selectedRole.title}
                </h3>
                <p className="mt-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-(--muted)">
                  {selectedRole.period}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center border border-foreground/40 transition-colors hover:border-foreground hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
                aria-label="Close role details"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="mt-6 overflow-y-auto pr-1">
              {/* Main Description */}
              {selectedRole.description && (
                <section>
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)">
                    Overview
                  </h4>
                  <p className="mt-2 text-base leading-relaxed text-foreground/90">
                    {selectedRole.description}
                  </p>
                </section>
              )}

              {/* Key Highlights */}
              {selectedRole.highlights && selectedRole.highlights.length > 0 && (
                <section className="mt-6">
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)">
                    Key Contributions & Responsibilities
                  </h4>
                  <ul className="mt-3 space-y-2.5">
                    {selectedRole.highlights.map((highlight, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85"
                      >
                        <span
                          className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-foreground"
                          aria-hidden="true"
                        />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Technologies */}
              {selectedRole.technologies && selectedRole.technologies.length > 0 && (
                <section className="mt-6 border-t border-foreground/20 pt-5">
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-(--muted)">
                    Core Technologies & Tools
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedRole.technologies.map((tech) => (
                      <span
                        key={tech}
                        className="border border-foreground/40 px-3 py-1 font-mono text-xs font-medium uppercase tracking-wider"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="mt-6 flex justify-end border-t border-foreground/20 pt-4">
              <button
                type="button"
                onClick={closeModal}
                className="border border-foreground px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-colors hover:bg-foreground hover:text-background"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}