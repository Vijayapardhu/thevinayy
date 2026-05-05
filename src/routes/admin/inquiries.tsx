import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Inquiry } from "@/types/db";
import { Inbox, Loader2, Mail, Phone, Calendar, ExternalLink, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inquiries")({
  component: InquiriesPage,
});

const STATUSES = ["new", "reviewing", "replied", "archived"] as const;

function InquiriesPage() {
  const [list, setList] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>("");

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data ?? []) as Inquiry[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = filter === "all" ? list : list.filter((i) => i.status === filter);

  async function updateStatus(id: string, status: string) {
    await supabase.from("inquiries").update({ status }).eq("id", id);
    load();
    toast.success(`Status: ${status}`);
  }
  async function saveNotes(id: string) {
    await supabase.from("inquiries").update({ admin_notes: notes }).eq("id", id);
    toast.success("Notes saved");
    load();
  }

  return (
    <div className="p-6 sm:p-10">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">Inbox</p>
        <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", ...STATUSES] as const).map((s) => {
          const count = s === "all" ? list.length : list.filter((i) => i.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium uppercase tracking-wider transition ${
                filter === s
                  ? "border-primary bg-gradient-primary text-primary-foreground"
                  : "border-border bg-card/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              {s}
              <span className={`rounded-full px-1.5 text-[10px] ${filter === s ? "bg-background/20" : "bg-secondary/60"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No inquiries here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((i) => {
            const expanded = openId === i.id;
            return (
              <div
                key={i.id}
                className="rounded-2xl border border-border bg-card/60 p-5 transition hover:border-primary/40"
              >
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(expanded ? null : i.id);
                    setNotes(i.admin_notes ?? "");
                  }}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <div className="flex items-center gap-2 font-semibold">
                      {i.full_name}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {i.project_type}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {i.email} · {new Date(i.created_at).toLocaleString()}
                    </div>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wider ${
                    i.status === "new" ? "bg-primary/20 text-primary-glow" :
                    i.status === "reviewing" ? "bg-warning/20 text-warning" :
                    i.status === "replied" ? "bg-success/20 text-success" :
                    "bg-muted/40 text-muted-foreground"
                  }`}>
                    {i.status}
                  </span>
                </button>

                {expanded && (
                  <div className="mt-5 space-y-4 border-t border-border pt-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Detail icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={i.email} href={`mailto:${i.email}`} />
                      {i.phone && <Detail icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={i.phone} />}
                      {i.budget_range && <Detail label="Budget" value={i.budget_range} />}
                      {i.deadline && <Detail icon={<Calendar className="h-3.5 w-3.5" />} label="Deadline" value={i.deadline} />}
                    </div>

                    <div>
                      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Project details</p>
                      <p className="rounded-lg border border-border bg-background/40 p-3 text-sm leading-relaxed">{i.project_details}</p>
                    </div>

                    {i.reference_links && (
                      <div>
                        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Reference links</p>
                        <p className="rounded-lg border border-border bg-background/40 p-3 text-xs text-primary-glow break-all">
                          {i.reference_links}
                        </p>
                      </div>
                    )}

                    <div>
                      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Admin notes</p>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-border bg-background/40 p-3 text-sm outline-none focus:border-primary"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateStatus(i.id, s)}
                          className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider transition ${
                            i.status === s
                              ? "border-primary bg-primary/20 text-primary-glow"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => saveNotes(i.id)}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
                      >
                        <Save className="h-3.5 w-3.5" /> Save notes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({
  icon, label, value, href,
}: { icon?: React.ReactNode; label: string; value: string; href?: string }) {
  const Wrap = href ? "a" : "div";
  return (
    <Wrap
      {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-3 rounded-lg border border-border bg-background/40 p-3"
    >
      <div>
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {icon} {label}
        </div>
        <div className="mt-0.5 text-sm text-foreground">{value}</div>
      </div>
      {href && <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />}
    </Wrap>
  );
}
