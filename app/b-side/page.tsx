"use client";

import { useGsapReveal } from "@/components/b-side/use-gsap-reveal";
import BSideHero from "@/components/b-side/b-side-hero";
import BSideAbout from "@/components/b-side/b-side-about";
import BSideExperience from "@/components/b-side/b-side-experience";
import BSideStack from "@/components/b-side/b-side-stack";
import BSideSkills from "@/components/b-side/b-side-skills";
import BSideProjects from "@/components/b-side/b-side-projects";
import BSideEducation from "@/components/b-side/b-side-education";
import BSideTestimonials from "@/components/b-side/b-side-testimonials";
import BSideAvailability from "@/components/b-side/b-side-availability";
import BSideGithubContributions from "@/components/b-side/b-side-github-contributions";
import BSideFooter from "@/components/b-side/b-side-footer";

export default function BSidePage() {
  const ref = useGsapReveal<HTMLDivElement>();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-8">
      <div ref={ref} className="bs-grid">
        <div className="col-full"><BSideHero /></div>
        <BSideAbout />
        <BSideExperience />
        <BSideStack />
        <BSideSkills />
        <div className="col-full"><BSideProjects /></div>
        <BSideEducation />
        <BSideTestimonials />
        <BSideAvailability />
        <div className="col-full"><BSideGithubContributions /></div>
        <div className="col-full"><BSideFooter /></div>
      </div>
    </main>
  );
}
