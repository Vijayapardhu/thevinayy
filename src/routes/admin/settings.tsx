import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, SiteSettings } from "@/types/db";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

const TABS = ["Hero", "Brand", "About", "Social", "Services", "Contact"] as const;

function SettingsPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Hero");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const showreelRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").limit(1).maybeSingle();
    setProfile(p as Profile | null);
    if (p) {
      const { data: s } = await supabase.from("site_settings").select("*").eq("profile_id", p.id).maybeSingle();
      setSettings(s as SiteSettings | null);
    }
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  async function saveProfile(updates: Partial<Profile>) {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(updates).eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  }

  async function saveSettings(updates: Partial<SiteSettings>) {
    if (!profile) return;
    setSaving(true);
    if (settings) {
      const { error } = await supabase.from("site_settings").update(updates).eq("id", settings.id);
      setSaving(false);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("site_settings").insert({ ...updates, profile_id: profile.id });
      setSaving(false);
      if (error) return toast.error(error.message);
    }
    toast.success("Saved");
    load();
  }

  async function uploadFile(bucket: string, file: File): Promise<string | null> {
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) {
      toast.error(error.message);
      return null;
    }
    return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary-glow" />
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="p-10 text-muted-foreground">No profile found. Run the SQL setup script.</div>
    );
  }

  return (
    <div className="p-6 sm:p-10">
      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">Configuration</p>
        <h1 className="text-3xl font-bold tracking-tight">Site Settings</h1>
      </header>

      <div className="mb-8 flex flex-wrap gap-1 rounded-xl border border-border bg-card/40 p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === t ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-6 sm:p-8">
        {tab === "Hero" && (
          <SaveBlock onSave={(d) => saveSettings(d)} saving={saving}>
            {(set) => (
              <>
                <Field label="Hero heading">
                  <input defaultValue={settings?.hero_heading ?? ""} onChange={(e) => set("hero_heading", e.target.value)} className="form-input-admin" />
                </Field>
                <Field label="Hero subtext">
                  <textarea rows={3} defaultValue={settings?.hero_subtext ?? ""} onChange={(e) => set("hero_subtext", e.target.value)} className="form-input-admin resize-none" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Primary CTA">
                    <input defaultValue={settings?.cta_text ?? ""} onChange={(e) => set("cta_text", e.target.value)} className="form-input-admin" />
                  </Field>
                  <Field label="Secondary CTA">
                    <input defaultValue={settings?.cta2_text ?? ""} onChange={(e) => set("cta2_text", e.target.value)} className="form-input-admin" />
                  </Field>
                </div>
              </>
            )}
          </SaveBlock>
        )}

        {tab === "Brand" && (
          <SaveBlock onSave={(d) => saveProfile(d)} saving={saving}>
            {(set) => (
              <>
                <Field label="Showreel video URL or upload">
                  <input
                    defaultValue={profile.showreel_url ?? ""}
                    onChange={(e) => set("showreel_url", e.target.value)}
                    className="form-input-admin"
                    placeholder="https://..."
                  />
                  <button
                    type="button"
                    onClick={() => showreelRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary/40"
                  >
                    <Upload className="h-3.5 w-3.5" /> Upload showreel
                  </button>
                  <input
                    ref={showreelRef}
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await uploadFile("videos", f);
                      if (url) {
                        await saveProfile({ showreel_url: url });
                      }
                    }}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Primary color">
                    <ColorInput defaultValue={profile.primary_color} onChange={(v) => set("primary_color", v)} />
                  </Field>
                  <Field label="Accent color">
                    <ColorInput defaultValue={profile.accent_color} onChange={(v) => set("accent_color", v)} />
                  </Field>
                </div>
              </>
            )}
          </SaveBlock>
        )}

        {tab === "About" && (
          <SaveBlock onSave={(d) => saveProfile(d)} saving={saving}>
            {(set) => (
              <>
                <Field label="Profile photo">
                  <div className="flex items-center gap-4">
                    {profile.avatar_url && <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full object-cover" />}
                    <button
                      type="button"
                      onClick={() => avatarRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs hover:border-primary/40"
                    >
                      <Upload className="h-3.5 w-3.5" /> Upload avatar
                    </button>
                    <input
                      ref={avatarRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const url = await uploadFile("avatars", f);
                        if (url) await saveProfile({ avatar_url: url });
                      }}
                    />
                  </div>
                </Field>
                <Field label="Display name">
                  <input defaultValue={profile.display_name} onChange={(e) => set("display_name", e.target.value)} className="form-input-admin" />
                </Field>
                <Field label="Tagline">
                  <input defaultValue={profile.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} className="form-input-admin" />
                </Field>
                <Field label="Bio">
                  <textarea rows={5} defaultValue={profile.bio ?? ""} onChange={(e) => set("bio", e.target.value)} className="form-input-admin resize-none" />
                </Field>
              </>
            )}
          </SaveBlock>
        )}

        {tab === "Social" && (
          <SocialEditor profile={profile} onSave={saveProfile} saving={saving} />
        )}

        {tab === "Services" && (
          <ListEditor
            label="Services / Skills"
            items={profile.services}
            onSave={(services) => saveProfile({ services })}
            saving={saving}
          />
        )}

        {tab === "Contact" && (
          <SaveBlock onSave={(d) => saveProfile(d)} saving={saving}>
            {(set) => (
              <>
                <Field label="Contact email">
                  <input defaultValue={profile.contact_email ?? ""} onChange={(e) => set("contact_email", e.target.value)} className="form-input-admin" />
                </Field>
                <Field label="WhatsApp number">
                  <input defaultValue={profile.whatsapp ?? ""} onChange={(e) => set("whatsapp", e.target.value)} className="form-input-admin" placeholder="+1 555 000 0000" />
                </Field>
                <Field label="Available for projects">
                  <select
                    defaultValue={profile.is_available ? "yes" : "no"}
                    onChange={(e) => set("is_available", e.target.value === "yes")}
                    className="form-input-admin"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </Field>
              </>
            )}
          </SaveBlock>
        )}
      </div>

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

function SaveBlock<T extends Record<string, unknown>>({
  children, onSave, saving,
}: { children: (set: <K extends keyof T>(key: K, val: T[K]) => void) => React.ReactNode; onSave: (d: T) => void; saving: boolean }) {
  const [draft, setDraft] = useState<T>({} as T);
  function set<K extends keyof T>(key: K, val: T[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }
  return (
    <div className="space-y-4">
      {children(set)}
      <button
        type="button"
        onClick={() => onSave(draft)}
        disabled={saving}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save changes
      </button>
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

function ColorInput({ defaultValue, onChange }: { defaultValue: string; onChange: (v: string) => void }) {
  const [val, setVal] = useState(defaultValue);
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={val}
        onChange={(e) => { setVal(e.target.value); onChange(e.target.value); }}
        className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-transparent"
      />
      <input
        value={val}
        onChange={(e) => { setVal(e.target.value); onChange(e.target.value); }}
        className="form-input-admin"
      />
    </div>
  );
}

function SocialEditor({ profile, onSave, saving }: { profile: Profile; onSave: (d: Partial<Profile>) => void; saving: boolean }) {
  const [links, setLinks] = useState<Array<[string, string]>>(
    Object.entries(profile.social_links || {})
  );
  function add() { setLinks([...links, ["", ""]]); }
  function update(i: number, k: string, v: string) {
    const next = [...links];
    next[i] = [k, v];
    setLinks(next);
  }
  function remove(i: number) { setLinks(links.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-3">
      {links.map(([k, v], i) => (
        <div key={i} className="flex gap-2">
          <input value={k} onChange={(e) => update(i, e.target.value, v)} placeholder="Platform (instagram)" className="form-input-admin" />
          <input value={v} onChange={(e) => update(i, k, e.target.value)} placeholder="https://..." className="form-input-admin" />
          <button type="button" onClick={() => remove(i)} className="rounded-lg border border-border px-3 text-sm text-muted-foreground hover:text-destructive">×</button>
        </div>
      ))}
      <div className="flex gap-2">
        <button type="button" onClick={add} className="rounded-full border border-border px-4 py-2 text-xs hover:border-primary/40">+ Add link</button>
        <button
          type="button"
          onClick={() => onSave({ social_links: Object.fromEntries(links.filter(([k, v]) => k && v)) })}
          disabled={saving}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save
        </button>
      </div>
    </div>
  );
}

function ListEditor({ label, items, onSave, saving }: { label: string; items: string[]; onSave: (items: string[]) => void; saving: boolean }) {
  const [list, setList] = useState<string[]>(items);
  const [input, setInput] = useState("");
  function add() {
    if (!input.trim()) return;
    setList([...list, input.trim()]);
    setInput("");
  }
  function remove(i: number) { setList(list.filter((_, idx) => idx !== i)); }

  return (
    <div className="space-y-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {list.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm">
            {s}
            <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add item..."
          className="form-input-admin"
        />
        <button type="button" onClick={add} className="rounded-lg border border-border px-4 text-sm hover:border-primary/40">Add</button>
      </div>
      <button
        type="button"
        onClick={() => onSave(list)}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </button>
    </div>
  );
}
