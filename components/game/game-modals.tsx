"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ExternalLink,
  CheckCircle2,
  Cpu,
  Layers,
  Award,
  GraduationCap,
  Gamepad2,
  Terminal,
  Server,
  Activity,
  Flame,
  Crown,
  ShieldCheck,
  Briefcase,
  Mail,
  FileText,
  Github,
  Linkedin,
  Copy,
  Check,
  Sparkles,
  Boxes,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import profileData from "@/app/profile-data.json";
import { retroAudio } from "./game-audio";

interface GameModalProps {
  type: string;
  onClose: () => void;
}

export default function GameModal({ type, onClose }: GameModalProps) {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [experienceIndex, setExperienceIndex] = useState(0);
  const [projectIndex, setProjectIndex] = useState(0);

  const handleClose = () => {
    retroAudio.playCancel();
    onClose();
  };

  const handleCopyEmail = () => {
    retroAudio.playInteract();
    navigator.clipboard.writeText("franzecalleja@gmail.com");
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  // Keyboard navigation for carousel modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        if (type === "experience") {
          retroAudio.playInteract();
          setExperienceIndex((prev) => (prev > 0 ? prev - 1 : profileData.experience.steps.length - 1));
        } else if (type === "projects") {
          retroAudio.playInteract();
          setProjectIndex((prev) => (prev > 0 ? prev - 1 : profileData.projects.items.length - 1));
        }
      } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        if (type === "experience") {
          retroAudio.playInteract();
          setExperienceIndex((prev) => (prev < profileData.experience.steps.length - 1 ? prev + 1 : 0));
        } else if (type === "projects") {
          retroAudio.playInteract();
          setProjectIndex((prev) => (prev < profileData.projects.items.length - 1 ? prev + 1 : 0));
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [type]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-3 backdrop-blur-sm">
      <div
        className="relative flex max-h-[96%] w-[96%] max-w-2xl flex-col justify-between overflow-hidden rounded-xl border-3 sm:border-4 border-amber-600/90 bg-slate-950 p-3 sm:p-4 font-mono text-slate-100 shadow-2xl"
        style={{
          boxShadow: "0 0 0 2px #0f172a, 0 10px 30px rgba(0,0,0,0.9), inset 0 0 20px rgba(0,0,0,0.8)",
          backgroundImage: "radial-gradient(circle at 50% 0%, rgba(30, 41, 59, 0.5) 0%, rgba(15, 23, 42, 0.95) 100%)",
        }}
      >
        {/* Ornate Retro Corner Screws */}
        <div className="absolute top-2 left-2 h-2 w-2 rounded-full border border-amber-400 bg-amber-600 shadow-inner" />
        <div className="absolute top-2 right-2 h-2 w-2 rounded-full border border-amber-400 bg-amber-600 shadow-inner" />
        <div className="absolute bottom-2 left-2 h-2 w-2 rounded-full border border-amber-400 bg-amber-600 shadow-inner" />
        <div className="absolute bottom-2 right-2 h-2 w-2 rounded-full border border-amber-400 bg-amber-600 shadow-inner" />

        {/* =========================================================================
            1. PROJECTS GUILD SHOWCASE // RESPONSIVE RETRO SPRITE CAROUSEL
            ========================================================================= */}
        {type === "projects" && (
          <div className="flex flex-1 flex-col justify-between min-h-0 overflow-hidden space-y-2">
            <div className="shrink-0 flex items-center justify-between border-b border-indigo-500/30 pb-1.5 pr-8">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Projects Showcase Guild</span>
                </div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  FEATURED ARTIFACTS
                </h2>
              </div>
              <div className="rounded border border-indigo-400 bg-indigo-950/80 px-2 py-0.5 text-center shadow-inner">
                <span className="text-[9px] font-bold tracking-widest text-indigo-300">
                  ITEM {String(projectIndex + 1).padStart(2, "0")} / {String(profileData.projects.items.length).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Main Interactive Carousel Row */}
            <div className="flex flex-1 items-center gap-1.5 sm:gap-2.5 min-h-0 overflow-hidden">
              {/* Left Button */}
              <button
                onClick={() => {
                  retroAudio.playInteract();
                  setProjectIndex((prev) => (prev > 0 ? prev - 1 : profileData.projects.items.length - 1));
                }}
                className="self-center shrink-0 flex h-10 w-7 sm:h-12 sm:w-9 flex-col items-center justify-center rounded-lg border-2 border-indigo-400 bg-gradient-to-b from-indigo-500 to-indigo-700 text-white shadow-md transition-all hover:from-indigo-400 hover:to-indigo-600 active:scale-95"
                title="Previous Project (ArrowLeft / A)"
              >
                <ChevronLeft className="h-5 w-5 stroke-[3]" />
                <span className="hidden text-[8px] font-bold sm:inline">[A]</span>
              </button>

              {/* Center Active Project Sprite Card */}
              {(() => {
                const project = profileData.projects.items[projectIndex];
                return (
                  <div className="flex flex-1 flex-col justify-between max-h-full min-h-0 overflow-y-auto rounded-lg border border-indigo-500/40 sm:border-2 bg-slate-900/95 p-2.5 sm:p-3.5 shadow-xl space-y-2">
                    {/* Item Badge Slot Header */}
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded border border-amber-400 bg-indigo-950 font-bold text-[10px] text-amber-300">
                          #{String(projectIndex + 1).padStart(2, "0")}
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold text-indigo-400">
                          [MYTHIC GRADE ARTIFACT]
                        </span>
                      </div>
                      <span className="rounded border border-emerald-400/40 bg-emerald-950/60 px-1.5 py-0.2 text-[8px] sm:text-[9px] font-bold uppercase text-emerald-300">
                        PRODUCTION ACTIVE
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                        {project.name}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-slate-200 line-clamp-3 sm:line-clamp-4">
                        {project.description}
                      </p>
                    </div>

                    {/* Socketed Technologies */}
                    <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
                      <div className="text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Equipped Tech Stack:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="rounded border border-indigo-400/30 bg-indigo-950/50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-200"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Live Action Link Button */}
                    <div className="border-t border-slate-800 pt-2">
                      {project.href && (
                        <a
                          href={project.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded border border-indigo-400 bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow hover:bg-indigo-500 active:scale-95"
                        >
                          <span>[EQUIP / LAUNCH APPLICATION]</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Right Button */}
              <button
                onClick={() => {
                  retroAudio.playInteract();
                  setProjectIndex((prev) => (prev < profileData.projects.items.length - 1 ? prev + 1 : 0));
                }}
                className="self-center shrink-0 flex h-10 w-7 sm:h-12 sm:w-9 flex-col items-center justify-center rounded-lg border-2 border-indigo-400 bg-gradient-to-b from-indigo-500 to-indigo-700 text-white shadow-md transition-all hover:from-indigo-400 hover:to-indigo-600 active:scale-95"
                title="Next Project (ArrowRight / D)"
              >
                <ChevronRight className="h-5 w-5 stroke-[3]" />
                <span className="hidden text-[8px] font-bold sm:inline">[D]</span>
              </button>
            </div>

            {/* Pagination Indicators & Close Action */}
            <div className="shrink-0 flex items-center justify-between border-t border-slate-800 pt-1.5">
              <span className="text-[9px] text-slate-400">◀ / ▶ or [A / D] to cycle</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {profileData.projects.items.map((p, idx) => (
                    <button
                      key={p.name}
                      onClick={() => {
                        retroAudio.playInteract();
                        setProjectIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        projectIndex === idx
                          ? "w-5 bg-indigo-400 shadow-[0_0_6px_#818cf8]"
                          : "w-2 bg-slate-700 hover:bg-slate-500"
                      }`}
                      title={p.name}
                    />
                  ))}
                </div>
                <button
                  onClick={handleClose}
                  className="rounded border border-indigo-400/40 bg-indigo-950/60 px-2 py-0.5 text-[9px] font-bold text-indigo-300 hover:bg-indigo-900 active:scale-95"
                >
                  RETURN [ESC]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            2. CAREER & WORK EXPERIENCE // RESPONSIVE RETRO SPRITE CAROUSEL
            ========================================================================= */}
        {type === "experience" && (
          <div className="flex flex-1 flex-col justify-between min-h-0 overflow-hidden space-y-2">
            {/* Header with Title & Record Counter */}
            <div className="shrink-0 flex items-center justify-between border-b border-blue-500/30 pb-1.5 pr-8">
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                  <Briefcase className="h-3.5 w-3.5" />
                  <span>Guildmaster Career Archives</span>
                </div>
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                  CAREER ACHIEVEMENTS & ROLES
                </h2>
              </div>
              <div className="rounded border border-amber-400 bg-amber-950/80 px-2 py-0.5 text-center shadow-inner">
                <span className="text-[9px] font-bold tracking-widest text-amber-300">
                  ENTRY {String(experienceIndex + 1).padStart(2, "0")} / {String(profileData.experience.steps.length).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Main Interactive Carousel Row: [ ◀ Left Button ] [ Hero Sprite Card ] [ Right Button ▶ ] */}
            <div className="flex flex-1 items-center gap-1.5 sm:gap-2.5 min-h-0 overflow-hidden">
              {/* Left Carousel Button */}
              <button
                onClick={() => {
                  retroAudio.playInteract();
                  setExperienceIndex((prev) => (prev > 0 ? prev - 1 : profileData.experience.steps.length - 1));
                }}
                className="self-center shrink-0 flex h-10 w-7 sm:h-12 sm:w-9 flex-col items-center justify-center rounded-lg border-2 border-amber-400 bg-gradient-to-b from-amber-500 to-amber-600 text-black shadow-md transition-all hover:from-amber-400 hover:to-amber-500 active:scale-95"
                title="Previous Role (ArrowLeft / A)"
              >
                <ChevronLeft className="h-5 w-5 stroke-[3]" />
                <span className="hidden text-[8px] font-bold sm:inline">[A]</span>
              </button>

              {/* Center Active Sprite Achievement Card */}
              {(() => {
                const job = profileData.experience.steps[experienceIndex];
                return (
                  <div className="flex flex-1 flex-col justify-between max-h-full min-h-0 overflow-y-auto rounded-lg border border-blue-500/40 sm:border-2 bg-slate-900/95 p-2.5 sm:p-3.5 shadow-xl space-y-2">
                    {/* Role Header Ribbon */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-blue-500/20 pb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-amber-400 bg-gradient-to-br from-amber-500/20 to-blue-900/60 text-amber-300">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-amber-400">
                              [LVL 99 LEAD ENGINEER]
                            </span>
                            {job.current && (
                              <span className="rounded border border-emerald-400/40 bg-emerald-950/60 px-1 py-0.2 text-[8px] font-bold uppercase text-emerald-300">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                            {job.title}
                          </h3>
                          <p className="text-[11px] font-bold text-sky-400">
                            {job.caption} • <span className="text-slate-400 font-semibold">{job.period}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Role Lore & Overview */}
                    <div className="rounded border border-slate-800 bg-slate-950/60 p-2">
                      <p className="text-xs leading-relaxed text-slate-200">
                        {job.description}
                      </p>
                    </div>

                    {/* Key Objectives / Quest Achievements */}
                    {job.highlights && job.highlights.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-amber-300">
                          <Sparkles className="h-3 w-3 text-amber-400" />
                          <span>Key Mission Deliverables:</span>
                        </div>
                        <div className="grid gap-1 text-[11px] text-slate-300">
                          {job.highlights.slice(0, 2).map((h, i) => (
                            <div key={i} className="flex items-start gap-1.5 rounded border border-blue-500/20 bg-blue-950/20 p-1.5">
                              <Check className="h-3 w-3 shrink-0 text-emerald-400 mt-0.5" />
                              <span className="leading-snug">{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Socketed Technologies / Runes */}
                    <div className="border-t border-slate-800 pt-1.5">
                      <div className="text-[9px] font-bold uppercase text-slate-400 mb-1">
                        Equipped Tech Runes:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {job.technologies.map((tech) => (
                          <span
                            key={tech}
                            className="flex items-center gap-1 rounded border border-blue-400/30 bg-blue-950/50 px-1.5 py-0.2 text-[9px] font-bold text-blue-200"
                          >
                            <span className="h-1 w-1 rounded-full bg-blue-400" />
                            <span>{tech}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Right Carousel Button */}
              <button
                onClick={() => {
                  retroAudio.playInteract();
                  setExperienceIndex((prev) => (prev < profileData.experience.steps.length - 1 ? prev + 1 : 0));
                }}
                className="self-center shrink-0 flex h-10 w-7 sm:h-12 sm:w-9 flex-col items-center justify-center rounded-lg border-2 border-amber-400 bg-gradient-to-b from-amber-500 to-amber-600 text-black shadow-md transition-all hover:from-amber-400 hover:to-amber-500 active:scale-95"
                title="Next Role (ArrowRight / D)"
              >
                <ChevronRight className="h-5 w-5 stroke-[3]" />
                <span className="hidden text-[8px] font-bold sm:inline">[D]</span>
              </button>
            </div>

            {/* Pagination Step Indicators & Close Action */}
            <div className="shrink-0 flex items-center justify-between border-t border-slate-800 pt-1.5">
              <span className="text-[9px] text-slate-400">◀ / ▶ or [A / D] to cycle</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {profileData.experience.steps.map((s, idx) => (
                    <button
                      key={s.caption}
                      onClick={() => {
                        retroAudio.playInteract();
                        setExperienceIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all ${
                        experienceIndex === idx
                          ? "w-6 bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                          : "w-2 bg-slate-700 hover:bg-slate-500"
                      }`}
                      title={s.caption}
                    />
                  ))}
                </div>
                <button
                  onClick={handleClose}
                  className="rounded border border-amber-400/40 bg-amber-950/60 px-2 py-0.5 text-[9px] font-bold text-amber-300 hover:bg-amber-900 active:scale-95"
                >
                  RETURN [ESC]
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            3. VILLAGE POST & INQUIRIES // DISPATCH TELEGRAMS & RESUME
            ========================================================================= */}
        {type === "contact" && (
          <div className="flex flex-1 flex-col justify-between min-h-0 overflow-hidden space-y-2">
            <div className="shrink-0 border-b border-amber-500/30 pb-1.5 pr-8">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                <Mail className="h-3.5 w-3.5" />
                <span>Village Post & Courier Lodge</span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                TRANSMIT INQUIRY TO FRANZE
              </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto grid gap-2.5 sm:grid-cols-2 pr-1">
              {/* Direct Mail Courier Postcard */}
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/15 p-3 space-y-2.5">
                <div className="flex items-center justify-between border-b border-amber-500/20 pb-1.5">
                  <span className="text-[10px] font-bold text-amber-400">[COURIER DISPATCH]</span>
                  <span className="rounded bg-amber-500 px-1 py-0.2 text-[8px] font-bold text-black uppercase">
                    PRIORITY
                  </span>
                </div>

                <div className="space-y-0.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Official Mailbox:</div>
                  <div className="text-xs font-bold text-white">franzecalleja@gmail.com</div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <button
                    onClick={handleCopyEmail}
                    className="flex items-center gap-1 rounded border border-amber-400 bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-black hover:bg-amber-400 active:scale-95"
                  >
                    {copiedEmail ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedEmail ? "COPIED!" : "COPY EMAIL"}</span>
                  </button>

                  <a
                    href="mailto:franzecalleja@gmail.com"
                    className="flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-200 hover:bg-slate-700"
                  >
                    <Mail className="h-3 w-3" />
                    <span>OPEN CLIENT</span>
                  </a>
                </div>
              </div>

              {/* Guild Documentation & Social Relics */}
              <div className="rounded-lg border border-sky-500/40 bg-sky-950/15 p-3 space-y-2">
                <div className="flex items-center justify-between border-b border-sky-500/20 pb-1.5">
                  <span className="text-[10px] font-bold text-sky-400">[GUILD DOCUMENTS]</span>
                  <span className="rounded bg-sky-500 px-1 py-0.2 text-[8px] font-bold text-black uppercase">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-1.5">
                  <a
                    href="/FRANZE_CALLEJA_RESUME.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded border border-sky-500/40 bg-slate-900 p-2 text-[11px] font-bold text-white hover:border-sky-400"
                  >
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-sky-400" />
                      <span>Download Resume (PDF)</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-sky-400" />
                  </a>

                  <a
                    href="https://github.com/franzecalleja"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 p-2 text-[11px] font-bold text-white hover:border-slate-500"
                  >
                    <div className="flex items-center gap-1.5">
                      <Github className="h-3.5 w-3.5 text-slate-300" />
                      <span>GitHub Vault</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>

                  <a
                    href="https://linkedin.com/in/franzecalleja"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded border border-slate-700 bg-slate-900 p-2 text-[11px] font-bold text-white hover:border-slate-500"
                  >
                    <div className="flex items-center gap-1.5">
                      <Linkedin className="h-3.5 w-3.5 text-blue-400" />
                      <span>LinkedIn Profile</span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-slate-400" />
                  </a>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-800 pt-1.5 flex justify-end">
              <button
                onClick={handleClose}
                className="rounded border border-amber-500 bg-amber-500 px-3 py-1 text-[11px] font-bold text-black hover:bg-amber-400 active:scale-95"
              >
                RETURN [ESC]
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            4. DEVOPS & OBSERVABILITY POWER PLANT
            ========================================================================= */}
        {type === "devops" && (
          <div className="flex flex-1 flex-col justify-between min-h-0 overflow-hidden space-y-2">
            <div className="shrink-0 border-b border-emerald-500/30 pb-1.5 pr-8">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                <Cpu className="h-3.5 w-3.5" />
                <span>DevOps & Telemetry Power Station</span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                INFRASTRUCTURE & OBSERVABILITY
              </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto grid gap-2 sm:grid-cols-2 pr-1">
              <div className="rounded border border-emerald-500/40 bg-emerald-950/20 p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 text-xs">
                    <Server className="h-3.5 w-3.5" />
                    <span>Docker Containers</span>
                  </div>
                  <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[8px] font-bold text-emerald-300">
                    RUNTIMES
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Image-based containerized environments for deterministic builds and multi-service production.
                </p>
              </div>

              <div className="rounded border border-cyan-500/40 bg-cyan-950/20 p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-400 text-xs">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Prometheus & Grafana</span>
                  </div>
                  <span className="rounded bg-cyan-500/20 px-1 py-0.2 text-[8px] font-bold text-cyan-300">
                    TELEMETRY
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Full metrics ingestion, custom dashboards, latency tracking, and error budget monitors.
                </p>
              </div>

              <div className="rounded border border-amber-500/40 bg-amber-950/20 p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                    <Terminal className="h-3.5 w-3.5" />
                    <span>Loki, Alloy & Dozzle</span>
                  </div>
                  <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[8px] font-bold text-amber-300">
                    LOGS
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Centralized log collection, real-time container inspection, and structured indexing.
                </p>
              </div>

              <div className="rounded border border-purple-500/40 bg-purple-950/20 p-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-purple-400 text-xs">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Uptime Kuma (99.9% SLO)</span>
                  </div>
                  <span className="rounded bg-purple-500/20 px-1 py-0.2 text-[8px] font-bold text-purple-300">
                    SENTINEL
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Heartbeat monitoring, SSL certificate expiry tracking, status broadcasting, and alerts.
                </p>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-800 pt-1.5 flex justify-end">
              <button
                onClick={handleClose}
                className="rounded border border-amber-500 bg-amber-500 px-3 py-1 text-[11px] font-bold text-black hover:bg-amber-400 active:scale-95"
              >
                RETURN [ESC]
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            5. TECH ARSENAL // ENAMEL GYM BADGE CASE
            ========================================================================= */}
        {type === "stack" && (
          <div className="flex flex-1 flex-col justify-between min-h-0 overflow-hidden space-y-2">
            <div className="shrink-0 border-b border-sky-500/30 pb-1.5 pr-8">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sky-400">
                <Boxes className="h-3.5 w-3.5" />
                <span>Tech Arsenal // Enamel Gym Badge Case</span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                SKILL & BADGE MATRIX
              </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto grid gap-2 sm:grid-cols-2 md:grid-cols-3 pr-1">
              {profileData.techstack.items.map((tech) => (
                <div
                  key={tech.label}
                  className="flex items-center justify-between rounded border border-sky-500/40 bg-slate-900/90 p-2 transition-all hover:border-sky-300"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-amber-400 bg-sky-950 font-bold text-[10px] text-sky-300">
                      <Sparkles className="h-3 w-3 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {tech.label}
                      </h4>
                      <p className="text-[9px] text-slate-400">{tech.category}</p>
                    </div>
                  </div>
                  <span className="rounded border border-sky-400/40 bg-sky-950/60 px-1 py-0.2 text-[8px] font-bold text-sky-300">
                    MAX
                  </span>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-slate-800 pt-1.5 flex justify-end">
              <button
                onClick={handleClose}
                className="rounded border border-amber-500 bg-amber-500 px-3 py-1 text-[11px] font-bold text-black hover:bg-amber-400 active:scale-95"
              >
                RETURN [ESC]
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            6. INDIVIDUAL GAME BANNERS
            ========================================================================= */}
        {type.startsWith("banner_") && (
          <div className="flex flex-1 flex-col justify-between min-h-0 overflow-hidden space-y-2">
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
              {type === "banner_mseuf" && (
                <div className="space-y-3">
                  <div className="border-b border-red-500/30 pb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400">
                      <Crown className="h-3.5 w-3.5" />
                      <span>Enterprise Guild Banner</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black uppercase text-white">
                      MSEUF-CI LEAD ENGINEER
                    </h2>
                    <p className="text-[10px] text-slate-400">August 2025 - Present • Institutional Scale</p>
                  </div>
                  <div className="rounded border border-red-500/40 bg-red-950/20 p-3 space-y-2">
                    <p className="text-xs leading-relaxed text-slate-200">
                      Leading development of internal enterprise systems, software infrastructures, and production observability platforms across large-scale institutional operations.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["Next.js", "Docker", "Grafana", "Prometheus", "Loki", "PostgreSQL", "Node.js"].map((t) => (
                        <span key={t} className="rounded border border-red-500/40 bg-slate-900 px-1.5 py-0.2 text-[10px] font-bold text-red-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {type === "banner_raones" && (
                <div className="space-y-3">
                  <div className="border-b border-blue-500/30 pb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                      <Briefcase className="h-3.5 w-3.5" />
                      <span>Startup Guild Banner</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black uppercase text-white">
                      R-A-ONES LEAD ENGINEER
                    </h2>
                    <p className="text-[10px] text-slate-400">January 2026 - Present • Startup Velocity</p>
                  </div>
                  <div className="rounded border border-blue-500/40 bg-blue-950/20 p-3 space-y-2">
                    <p className="text-xs leading-relaxed text-slate-200">
                      Directing full-lifecycle development across high-throughput backend APIs, cloud infrastructure, microservices, and cross-platform mobile applications.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["Next.js", "React Native", "Expo", "Node.js", "Prisma", "PostgreSQL", "Cloud"].map((t) => (
                        <span key={t} className="rounded border border-blue-500/40 bg-slate-900 px-1.5 py-0.2 text-[10px] font-bold text-blue-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {type === "banner_ellipsense" && (
                <div className="space-y-3">
                  <div className="border-b border-emerald-500/30 pb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      <Award className="h-3.5 w-3.5" />
                      <span>Global Freelance Alliance</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black uppercase text-white">
                      ELLIPSENSE LEAD DEVELOPER
                    </h2>
                    <p className="text-[10px] text-slate-400">2023 - Present • Global Delivery</p>
                  </div>
                  <div className="rounded border border-emerald-500/40 bg-emerald-950/20 p-3 space-y-2">
                    <p className="text-xs leading-relaxed text-slate-200">
                      Leading a distributed engineering team delivering full-stack web platforms, client apps, and tailored database architectures worldwide.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["Next.js", "TypeScript", "Node.js", "React", "Prisma", "MySQL"].map((t) => (
                        <span key={t} className="rounded border border-emerald-500/40 bg-slate-900 px-1.5 py-0.2 text-[10px] font-bold text-emerald-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {type === "banner_techbears" && (
                <div className="space-y-3">
                  <div className="border-b border-amber-500/30 pb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      <Activity className="h-3.5 w-3.5" />
                      <span>Mobility Fleet Banner</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black uppercase text-white">
                      TECHBEARS SOLUTIONS
                    </h2>
                    <p className="text-[10px] text-slate-400">August 2025 - January 2026 • Ride-Hailing Platform</p>
                  </div>
                  <div className="rounded border border-amber-500/40 bg-amber-950/20 p-3 space-y-2">
                    <p className="text-xs leading-relaxed text-slate-200">
                      Engineered administrative web dashboards, driver operations consoles, and monitoring tools for a commercial ride-hailing transportation platform.
                    </p>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {["Next.js", "TypeScript", "Tailwind CSS", "ZOHO OAuth", "SSO"].map((t) => (
                        <span key={t} className="rounded border border-amber-500/40 bg-slate-900 px-1.5 py-0.2 text-[10px] font-bold text-amber-300">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {type === "banner_lebron" && (
                <div className="space-y-3">
                  <div className="border-b border-amber-500/30 pb-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                      <Crown className="h-3.5 w-3.5" />
                      <span>The King #23 Championship Banner</span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black uppercase text-white">
                      LEBRON JAMES // THE GOAT
                    </h2>
                  </div>
                  <div className="rounded border border-amber-500/40 bg-amber-950/20 p-3 space-y-2">
                    <p className="text-xs leading-relaxed text-slate-200">
                      Franze is a die-hard basketball fan with loyal allegiance to <strong className="text-amber-400">LeBron James</strong> (the undisputed GOAT) wherever he plays.
                    </p>
                    <div className="text-amber-300 font-bold text-[11px]">
                      4x NBA Champion • 4x Finals MVP • 4x Season MVP • All-Time Scoring King
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="shrink-0 border-t border-slate-800 pt-1.5 flex justify-end">
              <button
                onClick={handleClose}
                className="rounded border border-amber-500 bg-amber-500 px-3 py-1 text-[11px] font-bold text-black hover:bg-amber-400 active:scale-95"
              >
                RETURN [ESC]
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            7. EDUCATION & HONORS // ACADEMIC SCROLL
            ========================================================================= */}
        {type === "education" && (
          <div className="flex flex-1 flex-col justify-between min-h-0 overflow-hidden space-y-2">
            <div className="shrink-0 border-b border-red-500/30 pb-1.5 pr-8">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400">
                <GraduationCap className="h-3.5 w-3.5" />
                <span>Academy of Enverga</span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                ACADEMIC DIPLOMA & HONORS
              </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
              {profileData.education.items.map((item) => (
                <div
                  key={item.institution}
                  className="rounded border border-red-500/40 bg-red-950/20 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between border-b border-red-500/20 pb-1">
                    <span className="text-[10px] font-bold text-red-400 uppercase">
                      [ACCREDITED DEGREE]
                    </span>
                    <span className="rounded bg-red-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                      CLASS OF {item.year}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-black text-white">
                    {item.degree}
                  </h3>
                  <p className="text-xs font-semibold text-slate-300">
                    {item.institution}
                  </p>

                  <div className="rounded border border-amber-500/40 bg-slate-900 p-2.5 text-xs space-y-0.5">
                    <div className="font-bold text-amber-400 text-[11px]">🏆 Latin Honors Achieved:</div>
                    <div className="font-bold text-white text-xs sm:text-sm">{item.honors}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="shrink-0 border-t border-slate-800 pt-1.5 flex justify-end">
              <button
                onClick={handleClose}
                className="rounded border border-amber-500 bg-amber-500 px-3 py-1 text-[11px] font-bold text-black hover:bg-amber-400 active:scale-95"
              >
                RETURN [ESC]
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            8. GAMING & BASKETBALL // OFF-DUTY TROPHY CASE
            ========================================================================= */}
        {type === "gaming" && (
          <div className="flex flex-1 flex-col justify-between min-h-0 overflow-hidden space-y-2">
            <div className="shrink-0 border-b border-purple-500/30 pb-1.5 pr-8">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-400">
                <Gamepad2 className="h-3.5 w-3.5" />
                <span>The GOAT Basketball Court & Arcade Lounge</span>
              </div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                OFF-DUTY INTERESTS
              </h2>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto grid gap-2.5 sm:grid-cols-2 pr-1">
              <div className="rounded border border-amber-500/40 bg-amber-950/20 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-amber-400 text-xs">
                  <Flame className="h-3.5 w-3.5" />
                  <span>Basketball & The GOAT</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Die-hard basketball fan with unwavering allegiance to <strong className="text-amber-400">LeBron James</strong> (the undisputed GOAT) wherever he plays.
                </p>
              </div>

              <div className="rounded border border-purple-500/40 bg-purple-950/20 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-purple-400 text-xs">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  <span>PS5 & Favorite Games</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {profileData.interests.gaming.map((game) => (
                    <span
                      key={game}
                      className="rounded border border-purple-500/40 bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-purple-300"
                    >
                      {game}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-slate-800 pt-1.5 flex justify-end">
              <button
                onClick={handleClose}
                className="rounded border border-amber-500 bg-amber-500 px-3 py-1 text-[11px] font-bold text-black hover:bg-amber-400 active:scale-95"
              >
                RETURN [ESC]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
