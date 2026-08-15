import EducationSection from "@/components/education-section";
import ExperienceTimeline from "@/components/experience-timeline";
import FeaturedProjects from "@/components/featured-projects";
import HomeHero from "@/components/home-hero";
import MainBottomNav from "@/components/main-bottom-nav";
import TechnicalArsenal from "@/components/technical-arsenal";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-background px-5 pb-28 pt-5 sm:px-10 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <HomeHero />
        <ExperienceTimeline />
        <FeaturedProjects />
        <EducationSection />
        <TechnicalArsenal />
      </div>
      <MainBottomNav />
    </main>
  );
}
