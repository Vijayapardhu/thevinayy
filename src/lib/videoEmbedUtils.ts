export type VideoSource =
  | "youtube"
  | "vimeo"
  | "drive"
  | "loom"
  | "dailymotion"
  | "direct"
  | "unknown";

export function detectVideoSource(url: string): VideoSource {
  if (!url) return "unknown";
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes("drive.google.com")) return "drive";
  if (u.includes("loom.com")) return "loom";
  if (u.includes("dailymotion.com") || u.includes("dai.ly")) return "dailymotion";
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url)) return "direct";
  return "unknown";
}

function getYouTubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([\w-]{6,})/,
    /youtube\.com\/watch\?v=([\w-]{6,})/,
    /youtube\.com\/embed\/([\w-]{6,})/,
    /youtube\.com\/shorts\/([\w-]{6,})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function getVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

function getDriveId(url: string): string | null {
  const m = url.match(/\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
  return m ? m[1] : null;
}

function getLoomId(url: string): string | null {
  const m = url.match(/loom\.com\/(?:share|embed)\/([\w-]+)/);
  return m ? m[1] : null;
}

function getDailymotionId(url: string): string | null {
  const m = url.match(/dailymotion\.com\/(?:embed\/)?video\/([\w]+)/) || url.match(/dai\.ly\/([\w]+)/);
  return m ? m[1] : null;
}

export interface EmbedInfo {
  source: VideoSource;
  embedUrl: string | null;
  thumbnailUrl: string | null;
}

export function getEmbedInfo(url: string, autoplay = false): EmbedInfo {
  const source = detectVideoSource(url);
  const ap = autoplay ? "1" : "0";
  switch (source) {
    case "youtube": {
      const id = getYouTubeId(url);
      if (!id) return { source, embedUrl: null, thumbnailUrl: null };
      return {
        source,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=${ap}&rel=0&modestbranding=1`,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    }
    case "vimeo": {
      const id = getVimeoId(url);
      if (!id) return { source, embedUrl: null, thumbnailUrl: null };
      return {
        source,
        embedUrl: `https://player.vimeo.com/video/${id}?autoplay=${ap}`,
        thumbnailUrl: null,
      };
    }
    case "drive": {
      const id = getDriveId(url);
      if (!id) return { source, embedUrl: null, thumbnailUrl: null };
      return {
        source,
        embedUrl: `https://drive.google.com/file/d/${id}/preview`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${id}&sz=w800`,
      };
    }
    case "loom": {
      const id = getLoomId(url);
      if (!id) return { source, embedUrl: null, thumbnailUrl: null };
      return {
        source,
        embedUrl: `https://www.loom.com/embed/${id}?autoplay=${autoplay}`,
        thumbnailUrl: null,
      };
    }
    case "dailymotion": {
      const id = getDailymotionId(url);
      if (!id) return { source, embedUrl: null, thumbnailUrl: null };
      return {
        source,
        embedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=${ap}`,
        thumbnailUrl: `https://www.dailymotion.com/thumbnail/video/${id}`,
      };
    }
    case "direct":
      return { source, embedUrl: url, thumbnailUrl: null };
    default:
      return { source: "unknown", embedUrl: null, thumbnailUrl: null };
  }
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);
}
