import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Film, Inbox, Folder, Eye, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Inquiry } from "@/types/db";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

interface Stats {
  videos: number;
  sections: number;
  inquiries: number;
  views: number;
}

function Dashboard() {
  const [stats, setStats] = useState<Stats>({ videos: 0, sections: 0, inquiries: 0, views: 0 });
  const [recent, setRecent] = useState<Inquiry[]>([]);

  useEffect(() => {
    (async () => {
      const [v, s, inq, allV] = await Promise.all([
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("sections").select("*", { count: "exact", head: true }).eq("is_visible", true),
        supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("videos").select("view_count"),
      ]);
      const totalViews = (allV.data ?? []).reduce((a, r) => a + (r.view_count ?? 0), 0);
      setStats({
        videos: v.count ?? 0,
        sections: s.count ?? 0,
        inquiries: inq.count ?? 0,
        views: totalViews,
      });
      const { data: recentData } = await supabase
        .from("inquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      setRecent((recentData ?? []) as Inquiry[]);
    })();
  }, []);

  const cards = [
    { label: "Total videos", value: stats.videos, icon: Film },
    { label: "Active sections", value: stats.sections, icon: Folder },
    { label: "New inquiries", value: stats.inquiries, icon: Inbox, accent: true },
    { label: "Total views", value: stats.views, icon: Eye },
  ];

  return (
    <div className="p-6 sm:p-10">
      <header className="mb-10">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">Dashboard</p>
        <h1 className="text-4xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-muted-foreground">Here's what's happening with your portfolio.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`group relative overflow-hidden rounded-2xl border p-5 transition ${
                c.accent ? "border-primary/40 bg-gradient-card shadow-glow" : "border-border bg-card/60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
                  <div className="mt-2 text-3xl font-bold text-foreground">{c.value}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mt-10 rounded-2xl border border-border bg-card/60">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold">Recent inquiries</h2>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </header>
        <ul className="divide-y divide-border">
          {recent.length === 0 ? (
            <li className="px-6 py-10 text-center text-sm text-muted-foreground">No inquiries yet.</li>
          ) : (
            recent.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-6 py-4 text-sm">
                <div>
                  <div className="font-medium text-foreground">{i.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {i.project_type} · {new Date(i.created_at).toLocaleDateString()}
                  </div>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {i.status}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
