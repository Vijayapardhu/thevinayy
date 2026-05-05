import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Section, Video, VideoType } from "@/types/db";
import { detectVideoSource, getEmbedInfo } from "@/lib/videoEmbedUtils";
import {
  Plus, Trash2, Pencil, Eye, EyeOff, Star, X, Upload, Link2, Loader2, Film,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/videos")({
  component: VideosPage,
});

interface Form {
  title: string;
  description: string;
  section_id: string;
  video_type: VideoType;
  video_url: string;
  thumbnail_url: string;
  duration: string;
  tags: string;
  is_featured: boolean;
  is_visible: boolean;
}

const emptyForm: Form = {
  title: "",
  description: "",
  section_id: "",
  video_type: "embed",
  video_url: "",
  thumbnail_url: "",
  duration: "",
  tags: "",
  is_featured: false,
  is_visible: true,
};

function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const [v, s] = await Promise.all([
      supabase.from("videos").select("*").order("sort_order"),
      supabase.from("sections").select("*").order("sort_order"),
    ]);
    setVideos((v.data ?? []) as Video[]);
    setSections((s.data ?? []) as Section[]);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyForm, section_id: sections[0]?.id ?? "" });
    setUploadProgress(0);
    setOpen(true);
  }
  function openEdit(v: Video) {
    setEditing(v);
    setForm({
      title: v.title,
      description: v.description ?? "",
      section_id: v.section_id ?? "",
      video_type: v.video_type,
      video_url: v.video_url,
      thumbnail_url: v.thumbnail_url ?? "",
      duration: v.duration ?? "",
      tags: v.tags.join(", "),
      is_featured: v.is_featured,
      is_visible: v.is_visible,
    });
    setOpen(true);
  }

  async function handleUpload(file: File) {
    setUploadProgress(1);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    // simulate progress (Supabase JS doesn't expose progress events without resumable uploader)
    const tick = setInterval(() => setUploadProgress((p) => Math.min(p + 5, 90)), 250);
    const { data, error } = await supabase.storage.from("videos").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    clearInterval(tick);
    if (error) {
      setUploadProgress(0);
      toast.error(error.message);
      return;
    }
    const { data: pub } = supabase.storage.from("videos").getPublicUrl(data.path);
    setForm((f) => ({ ...f, video_url: pub.publicUrl, video_type: "upload" }));
    setUploadProgress(100);
    toast.success("Uploaded");
  }

  async function save() {
    if (!form.title || !form.video_url || !form.section_id) {
      toast.error("Title, section, and video are required");
      return;
    }
    setSaving(true);
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      title: form.title,
      description: form.description || null,
      section_id: form.section_id,
      video_type: form.video_type,
      video_url: form.video_url,
      thumbnail_url: form.thumbnail_url || null,
      duration: form.duration || null,
      tags,
      is_featured: form.is_featured,
      is_visible: form.is_visible,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("videos").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("videos").insert({ ...payload, sort_order: videos.length }));
    }
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(editing ? "Video updated" : "Video added");
    setOpen(false);
    load();
  }

  async function toggleVisible(v: Video) {
    await supabase.from("videos").update({ is_visible: !v.is_visible }).eq("id", v.id);
    load();
  }
  async function toggleFeatured(v: Video) {
    await supabase.from("videos").update({ is_featured: !v.is_featured }).eq("id", v.id);
    load();
  }
  async function remove(v: Video) {
    if (!confirm(`Delete "${v.title}"?`)) return;
    await supabase.from("videos").delete().eq("id", v.id);
    toast.success("Deleted");
    load();
  }

  // Auto-detect on URL paste in embed mode
  useEffect(() => {
    if (form.video_type !== "embed" || !form.video_url) return;
    const info = getEmbedInfo(form.video_url);
    if (info.thumbnailUrl && !form.thumbnail_url) {
      setForm((f) => ({ ...f, thumbnail_url: info.thumbnailUrl! }));
    }
  }, [form.video_url, form.video_type, form.thumbnail_url]);

  const detected = form.video_type === "embed" ? detectVideoSource(form.video_url) : "direct";

  return (
    <div className="p-6 sm:p-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">Library</p>
          <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
        >
          <Plus className="h-4 w-4" /> Add video
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-24 text-center">
          <Film className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No videos yet.{" "}
            {sections.length === 0 && (
              <>Create a <a href="/admin/sections" className="text-primary-glow hover:underline">section</a> first.</>
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Video</th>
                <th className="p-3 text-left">Section</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {videos.map((v) => {
                const sec = sections.find((s) => s.id === v.section_id);
                const info = getEmbedInfo(v.video_url);
                const thumb = v.thumbnail_url || info.thumbnailUrl;
                return (
                  <tr key={v.id} className="bg-card/40 hover:bg-card/70 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-20 overflow-hidden rounded bg-secondary">
                          {thumb ? (
                            <img src={thumb} alt={v.title} className="h-full w-full object-cover" loading="lazy" />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate font-medium">
                            {v.is_featured && <Star className="h-3 w-3 fill-current text-primary-glow" />}
                            {v.title}
                          </div>
                          <div className="text-xs text-muted-foreground">{v.duration ?? "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{sec?.name ?? "—"}</td>
                    <td className="p-3">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-wider">
                        {v.video_type}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-1">
                        <IconBtn onClick={() => toggleFeatured(v)} title="Featured">
                          <Star className={`h-4 w-4 ${v.is_featured ? "fill-current text-primary-glow" : ""}`} />
                        </IconBtn>
                        <IconBtn onClick={() => toggleVisible(v)} title="Visible">
                          {v.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </IconBtn>
                        <IconBtn onClick={() => openEdit(v)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </IconBtn>
                        <IconBtn onClick={() => remove(v)} title="Delete" danger>
                          <Trash2 className="h-4 w-4" />
                        </IconBtn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setOpen(false)}>
          <div className="flex-1 bg-background/70 backdrop-blur-sm" />
          <div
            className="w-full max-w-lg overflow-y-auto bg-card border-l border-border p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editing ? "Edit video" : "Add video"}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Source toggle */}
            <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-border bg-background/50 p-1">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, video_type: "upload" }))}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  form.video_type === "upload" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
                }`}
              >
                <Upload className="h-4 w-4" /> Upload
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, video_type: "embed" }))}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  form.video_type === "embed" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground"
                }`}
              >
                <Link2 className="h-4 w-4" /> Paste link
              </button>
            </div>

            <div className="space-y-4">
              {form.video_type === "upload" ? (
                <div>
                  <Field label="Video file (mp4 / mov / webm, max 500MB)">
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/50 p-8 text-center transition hover:border-primary/50"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-foreground">Click to upload</p>
                      {form.video_url && (
                        <p className="break-all text-xs text-success">✓ Uploaded</p>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleUpload(f);
                      }}
                    />
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-gradient-primary transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </Field>
                </div>
              ) : (
                <Field label="Video URL (YouTube, Vimeo, Drive, Loom, etc.)">
                  <input
                    value={form.video_url}
                    onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                    className="form-input-admin"
                  />
                  {form.video_url && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Detected: <span className="text-primary-glow">{detected}</span>
                    </p>
                  )}
                </Field>
              )}

              <Field label="Title">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="form-input-admin"
                />
              </Field>

              <Field label="Section">
                <select
                  value={form.section_id}
                  onChange={(e) => setForm({ ...form, section_id: e.target.value })}
                  className="form-input-admin"
                >
                  <option value="">Select…</option>
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </Field>

              <Field label="Description">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="form-input-admin resize-none"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration (e.g. 2:45)">
                  <input
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="form-input-admin"
                  />
                </Field>
                <Field label="Thumbnail URL">
                  <input
                    value={form.thumbnail_url}
                    onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    className="form-input-admin"
                  />
                </Field>
              </div>

              <Field label="Tags (comma-separated)">
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="form-input-admin"
                  placeholder="cinematic, color, ad"
                />
              </Field>

              <div className="flex items-center gap-6 pt-2">
                <Toggle
                  label="Featured"
                  value={form.is_featured}
                  onChange={(v) => setForm({ ...form, is_featured: v })}
                />
                <Toggle
                  label="Visible"
                  value={form.is_visible}
                  onChange={(v) => setForm({ ...form, is_visible: v })}
                />
              </div>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editing ? "Save changes" : "Add video"}
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
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function IconBtn({
  children, onClick, title, danger,
}: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary ${
        danger ? "hover:bg-destructive/20 hover:text-destructive" : ""
      }`}
    >
      {children}
    </button>
  );
}

function Toggle({
  label, value, onChange,
}: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition ${value ? "bg-gradient-primary" : "bg-secondary"}`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-background transition ${value ? "left-[18px]" : "left-0.5"}`}
        />
      </span>
      <span className="text-foreground">{label}</span>
    </button>
  );
}
