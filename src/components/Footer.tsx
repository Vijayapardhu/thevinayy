import type { Profile, SiteSettings } from "@/types/db";

interface Props {
  profile: Profile | null;
  settings: SiteSettings | null;
}

export function Footer({ profile, settings }: Props) {
  return (
    <footer className="border-t border-border bg-card/40 py-10" data-aos="fade-in">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-primary text-xs font-bold text-primary-foreground">F</span>
          {settings?.footer_text || `© ${new Date().getFullYear()} ${profile?.display_name || "FrameFolio"}. All rights reserved.`}
        </div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Built with intent · Edited with care
        </div>
      </div>
    </footer>
  );
}
