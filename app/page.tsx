import EducationSection from "@/components/education-section";
import ExperienceTimeline from "@/components/experience-timeline";
import FeaturedProjects from "@/components/featured-projects";
import HomeHero from "@/components/home-hero";
import TechnicalArsenal from "@/components/technical-arsenal";

// Regenerate daily so "Present" bars in the experience ledger stay current.
export const revalidate = 86400;

export default function Home() {
  // Server component: reading the render time is intentional (see `revalidate`).
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <main className="min-h-screen overflow-x-clip bg-background px-5 pb-28 pt-5 sm:px-10 sm:pb-32 sm:pt-8 lg:px-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col">
        <HomeHero />
        <ExperienceTimeline now={now} />
        <FeaturedProjects />
        <EducationSection />
        <TechnicalArsenal />
      </div>
    </main>
  );
}
