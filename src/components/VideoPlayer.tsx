import { getEmbedInfo } from "@/lib/videoEmbedUtils";

interface VideoPlayerProps {
  url: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

export function VideoPlayer({ url, title, autoplay = true, className }: VideoPlayerProps) {
  const info = getEmbedInfo(url, autoplay);

  if (!info.embedUrl) {
    return (
      <div className={`flex aspect-video w-full items-center justify-center bg-muted text-muted-foreground ${className ?? ""}`}>
        Unable to load video
      </div>
    );
  }

  if (info.source === "direct") {
    return (
      <video
        src={info.embedUrl}
        controls
        autoPlay={autoplay}
        playsInline
        className={`aspect-video w-full bg-black ${className ?? ""}`}
      />
    );
  }

  return (
    <iframe
      src={info.embedUrl}
      title={title ?? "Video player"}
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowFullScreen
      className={`aspect-video w-full border-0 bg-black ${className ?? ""}`}
    />
  );
}
