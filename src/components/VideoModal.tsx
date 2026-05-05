import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { VideoPlayer } from "./VideoPlayer";
import type { Video } from "@/types/db";

interface Props {
  videos: Video[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function VideoModal({ videos, index, onClose, onIndexChange }: Props) {
  const open = index !== null && videos[index];
  const video = open ? videos[index!] : null;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && index! > 0) onIndexChange(index! - 1);
      if (e.key === "ArrowRight" && index! < videos.length - 1) onIndexChange(index! + 1);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, index, videos.length, onClose, onIndexChange]);

  return (
    <AnimatePresence>
      {open && video && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-elegant"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm transition hover:bg-background"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <VideoPlayer url={video.video_url} title={video.title} autoplay />

            <div className="space-y-3 p-6">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{video.title}</h2>
              {video.description && (
                <p className="text-sm text-muted-foreground">{video.description}</p>
              )}
              {video.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {video.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Prev / next */}
            {index! > 0 && (
              <button
                type="button"
                onClick={() => onIndexChange(index! - 1)}
                className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm transition hover:bg-background"
                aria-label="Previous video"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            {index! < videos.length - 1 && (
              <button
                type="button"
                onClick={() => onIndexChange(index! + 1)}
                className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-sm transition hover:bg-background"
                aria-label="Next video"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
