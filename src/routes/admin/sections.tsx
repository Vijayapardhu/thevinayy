import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Section } from "@/types/db";
import { slugify } from "@/lib/videoEmbedUtils";
import { Plus, Trash2, Pencil, Eye, EyeOff, Folder, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/sections")({
  component: SectionsPage,
});

interface Form {
  name: string;
  description: string;
  icon: string;
  accent_color: string;
}

const emptyForm: Form = { name: "", description: "", icon: "video", accent_color: "#7C3AED" };

function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("sections").select("*").order("sort_order");
    const list = (data ?? []) as Section[];
    setSections(list);

    const { data: vids } = await supabase.from("videos").select("section_id");
    const c: Record<string, number> = {};
    (vids ?? []).forEach((v) => {
      if (v.section_id) c[v.section_id] = (c[v.section_id] ?? 0) + 1;
    });
    setCounts(c);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }
  function openEdit(s: Section) {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      icon: s.icon,
      accent_color: s.accent_color,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const { data: profile } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
    const slug = slugify(form.name);
    const payload = {
      name: form.name.trim(),
      slug,
      description: form.description || null,
      icon: form.icon || "video",
      accent_color: form.accent_color,
      profile_id: profile?.id ?? null,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("sections").update(payload).eq("id", editing.id));
    } else {
      const sort_order = sections.length;
      ({ error } = await supabase.from("sections").insert({ ...payload, sort_order }));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Section updated" : "Section created");
    setOpen(false);
    load();
  }

  async function toggleVisible(s: Section) {
    await supabase.from("sections").update({ is_visible: !s.is_visible }).eq("id", s.id);
    load();
  }

  async function remove(s: Section) {
    if ((counts[s.id] ?? 0) > 0) {
      toast.error("Section has videos. Move/delete them first.");
      return;
    }
    if (!confirm(`Delete "${s.name}"?`)) return;
    const { error } = await supabase.from("sections").delete().eq("id", s.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    load();
  }

  return (
    <div className="p-6 sm:p-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">Categories</p>
          <h1 className="text-3xl font-bold tracking-tight">Sections</h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          New section
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
        </div>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
          <Folder className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No sections yet. Create your first category.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((s) => (
            <div
              key={s.id}
              className="group rounded-2xl border border-border bg-card/60 p-5 transition hover:border-primary/40"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-primary-foreground"
                  style={{ backgroundColor: s.accent_color }}
                >
                  <Folder className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleVisible(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                  >
                    {s.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(s)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
              {s.description && <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>}
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>/{s.slug}</span>
                <span>{counts[s.id] ?? 0} videos</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          <div className="flex-1 bg-background/70 backdrop-blur-sm" />
          <div
            className="w-full max-w-md overflow-y-auto bg-card border-l border-border p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? "Edit section" : "New section"}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="form-input-admin"
                  placeholder="e.g. Educational"
                />
                {form.name && (
                  <p className="mt-1 text-[11px] text-muted-foreground">URL: /{slugify(form.name)}</p>
                )}
              </Field>
              <Field label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-input-admin resize-none"
                />
              </Field>
              <Field label="Icon (Lucide name or emoji)">
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="form-input-admin"
                  placeholder="video"
                />
              </Field>
              <Field label="Accent color">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="h-10 w-16 cursor-pointer rounded-lg border border-border bg-transparent"
                  />
                  <input
                    value={form.accent_color}
                    onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                    className="form-input-admin"
                  />
                </div>
              </Field>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Create section"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-input-admin {
          width: 100%;
          background-color: oklch(from var(--background) l c h / 0.6);
          border: 1px solid var(--border);
          color: var(--foreground);
          padding: 0.6rem 0.8rem;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .form-input-admin:focus { border-color: var(--primary); box-shadow: 0 0 0 3px oklch(from var(--primary) l c h / 0.2); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
