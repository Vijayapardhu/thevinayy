import { Play, Star, Youtube, Video as VideoIcon } from "lucide-react";
import type { Video } from "@/types/db";
import { detectVideoSource, getEmbedInfo } from "@/lib/videoEmbedUtils";

interface Props {
  video: Video;
  onClick: () => void;
  delay?: number;
}

export function VideoCard({ video, onClick, delay = 0 }: Props) {
  const info = getEmbedInfo(video.video_url);
  const thumb = video.thumbnail_url || info.thumbnailUrl;
  const source = detectVideoSource(video.video_url);

  const SourceIcon =
    source === "youtube" ? Youtube : VideoIcon;

  return (
    <button
      type="button"
      onClick={onClick}
      data-aos="fade-up"
      data-aos-delay={delay}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-card text-left shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-glow ${
        video.is_featured ? "md:col-span-2" : ""
      }`}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-secondary">
        {thumb ? (
          <img
            src={thumb}
            alt={video.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-card">
            <VideoIcon className="h-12 w-12 text-muted-foreground" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 transition-opacity group-hover:opacity-80" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-glow backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Play className="ml-1 h-7 w-7 fill-current" />
          </div>
        </div>

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {video.is_featured && (
            <span className="flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-medium text-primary-foreground backdrop-blur-sm">
              <Star className="h-3 w-3 fill-current" /> Featured
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          {video.duration && (
            <span className="rounded-md bg-background/80 px-2 py-0.5 text-xs font-medium text-foreground backdrop-blur-sm">
              {video.duration}
            </span>
          )}
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-background/80 backdrop-blur-sm" title={source}>
            <SourceIcon className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
        </div>
      </div>

      <div className="space-y-2 p-5">
        <h3 className="line-clamp-1 text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-primary-glow">
          {video.title}
        </h3>
        {video.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{video.description}</p>
        )}
        {video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {video.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-secondary/60 px-2 py-0.5 text-[11px] uppercase tracking-wider text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
