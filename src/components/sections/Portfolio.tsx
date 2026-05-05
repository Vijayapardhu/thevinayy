import { useMemo, useState } from "react";
import { VideoCard } from "@/components/VideoCard";
import { VideoModal } from "@/components/VideoModal";
import type { Section, Video } from "@/types/db";
import { Film } from "lucide-react";

interface Props {
  sections: Section[];
  videos: Video[];
}

export function Portfolio({ sections, videos }: Props) {
  const [activeSlug, setActiveSlug] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...videos].sort((a, b) => {
      if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
      return a.sort_order - b.sort_order;
    });
    if (activeSlug === "all") return sorted;
    const sec = sections.find((s) => s.slug === activeSlug);
    if (!sec) return [];
    return sorted.filter((v) => v.section_id === sec.id);
  }, [activeSlug, sections, videos]);

  return (
    <section id="portfolio" className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div data-aos="fade-right">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">
              The Work
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Recent <span className="text-gradient">projects</span>
            </h2>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              A curated selection of edits across formats — from cinematic shorts to bold brand work.
            </p>
          </div>
        </div>

        {/* Category filter */}
        <div className="mb-10 flex flex-wrap gap-2 overflow-x-auto" data-aos="fade-up">
          <FilterPill
            label="All work"
            count={videos.length}
            active={activeSlug === "all"}
            onClick={() => setActiveSlug("all")}
          />
          {sections.map((sec) => {
            const count = videos.filter((v) => v.section_id === sec.id).length;
            if (count === 0) return null;
            return (
              <FilterPill
                key={sec.id}
                label={sec.name}
                count={count}
                active={activeSlug === sec.slug}
                onClick={() => setActiveSlug(sec.slug)}
              />
            );
          })}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
            <Film className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No videos in this category yet.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((v, i) => (
              <VideoCard key={v.id} video={v} delay={(i % 6) * 80} onClick={() => setOpenIndex(i)} />
            ))}
          </div>
        )}
      </div>

      <VideoModal
        videos={filtered}
        index={openIndex}
        onClose={() => setOpenIndex(null)}
        onIndexChange={setOpenIndex}
      />
    </section>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? "border-primary bg-gradient-primary text-primary-foreground shadow-glow"
          : "border-border bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 text-[11px] ${active ? "bg-background/20" : "bg-secondary/60"}`}>
        {count}
      </span>
    </button>
  );
}
