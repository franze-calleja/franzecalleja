import AboutCard from "@/components/about-card";
import AvailabilityCard from "@/components/availability-card";
import GalleryCard from "@/components/gallery-card";
import FooterCard from "@/components/footer-card";
import EducationCard from "@/components/education-card";
import ExperienceCard from "@/components/experience-card";
import ProfileHeader from "@/components/profile-header";
import ProjectsCard from "@/components/projects-card";
import SkillsCard from "@/components/skills-card";
import TechStackCard from "@/components/tech-stack-card";
import TestimonialsCard from "@/components/testimonials-card";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-start px-6 py-4 font-sans sm:px-10 sm:py-7 lg:px-16 lg:py-8">
      <div className="w-full space-y-2 sm:space-y-3">
        <ProfileHeader />

        <section id="about" className="grid gap-2 lg:grid-cols-3">
          <AboutCard />
          <ExperienceCard />
        </section>

        <section id="projects" className="grid gap-2 lg:grid-cols-3">
          <TechStackCard />
          <SkillsCard />
          <ProjectsCard />
        </section>

        <section className="grid gap-2 lg:grid-cols-3">
          <EducationCard />
          <TestimonialsCard />
          <AvailabilityCard />
        </section>

        <section id="gallery" className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          <GalleryCard />
        </section>

        <section className="grid gap-2 lg:grid-cols-3">
          <FooterCard />
        </section>
      </div>
    </main>
  );
}
