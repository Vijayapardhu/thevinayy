import { motion } from "framer-motion";
import { ArrowDown, Play } from "lucide-react";
import type { Profile, SiteSettings } from "@/types/db";

interface Props {
  profile: Profile | null;
  settings: SiteSettings | null;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const item = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const } },
};

export function Hero({ profile, settings }: Props) {
  const heading = settings?.hero_heading || "Cinematic stories, edited with intent.";
  const subtext = settings?.hero_subtext || "Crafting bold, emotive video content for brands, creators, and filmmakers worldwide.";
  const name = profile?.display_name || "FrameFolio";
  const tagline = profile?.tagline || "Video Editor & Storyteller";
  const cta1 = settings?.cta_text || "View My Work";
  const cta2 = settings?.cta2_text || "Hire Me";

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Showreel video bg */}
      {profile?.showreel_url && (
        <video
          src={profile.showreel_url}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
      )}

      {/* Grid backdrop */}
      <div className="absolute inset-0 grid-bg opacity-50" />

      {/* Floating glows */}
      <div className="absolute left-[10%] top-[20%] h-72 w-72 rounded-full bg-primary/20 blur-3xl animate-float" />
      <div className="absolute right-[10%] bottom-[20%] h-96 w-96 rounded-full bg-accent/15 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto max-w-5xl px-6 text-center"
      >
        <motion.p variants={item} className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          {profile?.is_available ? "Available for projects" : "Selected work"}
        </motion.p>

        <motion.h1 variants={item} className="text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-7xl md:text-8xl">
          {name.split(" ").map((word, i) => (
            <span key={i} className={i % 2 === 1 ? "text-gradient" : ""}>
              {word}{" "}
            </span>
          ))}
        </motion.h1>

        <motion.p variants={item} className="mt-4 text-lg font-medium text-primary-glow sm:text-xl">
          {tagline}
        </motion.p>

        <motion.h2 variants={item} className="mx-auto mt-6 max-w-3xl text-2xl font-medium leading-tight text-foreground/90 sm:text-3xl md:text-4xl">
          {heading}
        </motion.h2>

        <motion.p variants={item} className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {subtext}
        </motion.p>

        <motion.div variants={item} className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href="#portfolio"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition-all duration-300 hover:scale-[1.02] hover:shadow-elegant"
          >
            <Play className="h-4 w-4 fill-current" />
            {cta1}
          </a>
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-full border border-border bg-card/50 px-8 py-3.5 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:border-primary/40 hover:bg-card"
          >
            {cta2}
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <a
        href="#about"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground transition hover:text-foreground"
        aria-label="Scroll down"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <ArrowDown className="h-4 w-4 animate-scroll-bounce" />
      </a>
    </section>
  );
}
