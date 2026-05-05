import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Profile, SiteSettings } from "@/types/db";

interface Props {
  profile: Profile | null;
  settings: SiteSettings | null;
}

const schema = z.object({
  full_name: z.string().trim().min(2, "Please share your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  project_type: z.string().min(1, "Pick a project type"),
  budget_range: z.string().optional().or(z.literal("")),
  project_details: z.string().trim().min(20, "Tell me a bit more (min 20 chars)").max(2000),
  reference_links: z.string().trim().max(1000).optional().or(z.literal("")),
  deadline: z.string().optional().or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export function Contact({ profile, settings }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");

  const projectTypes = settings?.project_types?.length
    ? settings.project_types
    : ["Video Editing", "Color Grading", "Motion Graphics", "Short Film", "Promotional Video", "Other"];
  const budgets = settings?.budget_ranges?.length
    ? settings.budget_ranges
    : ["Under $500", "$500 - $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "$10,000+"];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const { error } = await supabase.from("inquiries").insert({
      profile_id: profile?.id ?? null,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      project_type: data.project_type,
      budget_range: data.budget_range || null,
      project_details: data.project_details,
      reference_links: data.reference_links || null,
      deadline: data.deadline || null,
    });
    if (error) {
      toast.error("Couldn't send your inquiry", { description: error.message });
      return;
    }
    setSubmitted(true);
    reset();
    setSelectedType("");
    toast.success("Inquiry sent — I'll be in touch soon.");
  }

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1fr_1.5fr]">
        {/* Left: contact info */}
        <div data-aos="fade-right">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary-glow">Contact</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Let's <span className="text-gradient">collaborate</span>.
          </h2>
          <p className="mt-6 text-base text-muted-foreground">
            Whether it's a brand campaign, a short film, or a multi-episode series — drop the details and I'll get back within 24 hours.
          </p>

          <div className="mt-10 space-y-4">
            {profile?.contact_email && (
              <a
                href={`mailto:${profile.contact_email}`}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 transition hover:border-primary/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Email</div>
                  <div className="text-sm font-medium text-foreground group-hover:text-primary-glow">
                    {profile.contact_email}
                  </div>
                </div>
              </a>
            )}
            {profile?.whatsapp && (
              <a
                href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card/60 p-4 transition hover:border-primary/40"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">WhatsApp</div>
                  <div className="text-sm font-medium text-foreground group-hover:text-primary-glow">
                    {profile.whatsapp}
                  </div>
                </div>
              </a>
            )}
          </div>

          {profile?.social_links && Object.keys(profile.social_links).length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {Object.entries(profile.social_links).map(([k, v], i) => (
                <a
                  key={k}
                  href={v}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-aos="zoom-in-up"
                  data-aos-delay={i * 80}
                  className="rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                >
                  {k}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Right: form */}
        <div className="relative" data-aos="fade-up">
          <div className="rounded-3xl border border-border bg-gradient-card p-6 shadow-elegant sm:p-10">
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-16 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-glow"
                  >
                    <CheckCircle2 className="h-10 w-10" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-foreground">Sent!</h3>
                  <p className="mt-2 text-muted-foreground">I'll get back to you within 24 hours.</p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-6 rounded-full border border-border bg-card px-5 py-2 text-sm text-foreground transition hover:border-primary/40"
                  >
                    Send another
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Full name" error={errors.full_name?.message}>
                      <input
                        {...register("full_name")}
                        placeholder="Your name"
                        className="form-input"
                      />
                    </Field>
                    <Field label="Email" error={errors.email?.message}>
                      <input
                        {...register("email")}
                        placeholder="you@email.com"
                        className="form-input"
                      />
                    </Field>
                  </div>

                  <Field label="Phone / WhatsApp (optional)">
                    <input {...register("phone")} placeholder="+1 (555) 000-0000" className="form-input" />
                  </Field>

                  <Field label="Project type" error={errors.project_type?.message}>
                    <div className="flex flex-wrap gap-2">
                      {projectTypes.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setSelectedType(t);
                            setValue("project_type", t, { shouldValidate: true });
                          }}
                          className={`rounded-full border px-4 py-1.5 text-xs font-medium transition ${
                            selectedType === t
                              ? "border-primary bg-gradient-primary text-primary-foreground"
                              : "border-border bg-card/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </Field>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Budget range">
                      <select {...register("budget_range")} className="form-input">
                        <option value="">Select…</option>
                        {budgets.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Deadline">
                      <input type="date" {...register("deadline")} className="form-input" />
                    </Field>
                  </div>

                  <Field label="Project details" error={errors.project_details?.message}>
                    <textarea
                      {...register("project_details")}
                      rows={5}
                      placeholder="Tell me about your project — goals, audience, vibe, deliverables…"
                      className="form-input resize-none"
                    />
                  </Field>

                  <Field label="Reference links (optional)">
                    <input {...register("reference_links")} placeholder="YouTube / Vimeo / Drive links" className="form-input" />
                  </Field>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-glow transition hover:shadow-elegant disabled:opacity-60"
                  >
                    {isSubmitting ? "Sending…" : "Send inquiry"}
                    <Send className="h-4 w-4 transition group-hover:translate-x-1" />
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Inline form-input style — uses semantic tokens */}
      <style>{`
        .form-input {
          width: 100%;
          background-color: oklch(from var(--background) l c h / 0.6);
          border: 1px solid var(--border);
          color: var(--foreground);
          padding: 0.65rem 0.9rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          transition: all 0.2s;
          outline: none;
        }
        .form-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px oklch(from var(--primary) l c h / 0.2);
        }
        .form-input::placeholder { color: var(--muted-foreground); }
      `}</style>
    </section>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}
