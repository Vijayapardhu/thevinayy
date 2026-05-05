import type { Profile } from "@/types/db";
import { Sparkles } from "lucide-react";

interface Props {
  profile: Profile | null;
  videosCount: number;
  sectionsCount: number;
}

export function About({ profile, videosCount, sectionsCount }: Props) {
  const stats = [
    { value: `${videosCount}+`, label: "Projects shipped" },
    { value: `${sectionsCount}`, label: "Categories" },
    { value: "5+", label: "Years editing" },
  ];

  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Avatar / portrait card */}
        <div data-aos="fade-right" className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-gradient-card shadow-elegant">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-gradient">
                {(profile?.display_name || "FF").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
          <div className="absolute -bottom-4 -right-4 rounded-2xl border border-border bg-card px-4 py-3 shadow-glow">
            <div className="flex items-center gap-2 text-xs font-medium text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary-glow" />
              Open for collaborations
            </div>
          </div>
        </div>

        <div data-aos="fade-left">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">
            About
          </p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Stories that <span className="text-gradient">stick</span>.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {profile?.bio ||
              "I edit video that earns attention — for creators, brands, and filmmakers who want their work to feel as good as it looks. Sharp pacing, intentional sound design, and a strong sense of story across every cut."}
          </p>

          {profile?.services && profile.services.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {profile.services.map((s, i) => (
                <span
                  key={s}
                  data-aos="fade-up"
                  data-aos-delay={i * 50}
                  className="rounded-full border border-border bg-card/60 px-4 py-1.5 text-sm text-foreground/90"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="mt-10 grid grid-cols-3 gap-4">
            {stats.map((s, i) => (
              <div
                key={s.label}
                data-aos="flip-up"
                data-aos-delay={i * 150}
                className="rounded-2xl border border-border bg-card/60 p-5"
              >
                <div className="text-3xl font-bold text-gradient">{s.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
