import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import AOS from "aos";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ScrollToTop } from "@/components/ScrollToTop";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Portfolio } from "@/components/sections/Portfolio";
import { Contact } from "@/components/sections/Contact";
import { usePortfolioData } from "@/hooks/usePortfolioData";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { profile, settings, sections, videos, loading } = usePortfolioData();

  // Re-init AOS once data renders so new elements get observed
  useEffect(() => {
    if (!loading) {
      setTimeout(() => AOS.refreshHard(), 100);
    }
  }, [loading, sections.length, videos.length]);

  // Apply admin's brand colors live
  useEffect(() => {
    if (profile?.primary_color) {
      document.documentElement.style.setProperty("--primary-hex", profile.primary_color);
    }
  }, [profile?.primary_color]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero profile={profile} settings={settings} />
        <About profile={profile} videosCount={videos.length} sectionsCount={sections.length} />
        <Portfolio sections={sections} videos={videos} />
        <Contact profile={profile} settings={settings} />
      </main>
      <Footer profile={profile} settings={settings} />
      <ScrollToTop />
    </div>
  );
}
