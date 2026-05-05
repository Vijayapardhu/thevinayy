import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, Section, Video, SiteSettings } from "@/types/db";

interface PortfolioData {
  profile: Profile | null;
  settings: SiteSettings | null;
  sections: Section[];
  videos: Video[];
  loading: boolean;
  error: string | null;
}

export function usePortfolioData(): PortfolioData {
  const [data, setData] = useState<PortfolioData>({
    profile: null,
    settings: null,
    sections: [],
    videos: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancel = false;
    async function load() {
      try {
        const [profileRes, sectionsRes, videosRes] = await Promise.all([
          supabase.from("profiles").select("*").order("created_at").limit(1).maybeSingle(),
          supabase.from("sections").select("*").eq("is_visible", true).order("sort_order"),
          supabase.from("videos").select("*").eq("is_visible", true).order("sort_order"),
        ]);
        if (cancel) return;

        const profile = (profileRes.data as Profile | null) ?? null;
        let settings: SiteSettings | null = null;
        if (profile) {
          const { data: s } = await supabase
            .from("site_settings")
            .select("*")
            .eq("profile_id", profile.id)
            .maybeSingle();
          settings = (s as SiteSettings | null) ?? null;
        }

        setData({
          profile,
          settings,
          sections: (sectionsRes.data ?? []) as Section[],
          videos: (videosRes.data ?? []) as Video[],
          loading: false,
          error: profileRes.error?.message ?? sectionsRes.error?.message ?? videosRes.error?.message ?? null,
        });
      } catch (e) {
        if (!cancel) {
          setData((d) => ({ ...d, loading: false, error: (e as Error).message }));
        }
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, []);

  return data;
}
