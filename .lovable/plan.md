# FrameFolio — Implementation Plan

A fully customizable animated portfolio for video editors with a public site and a no-code admin dashboard, powered by your existing Supabase project.

**Backend**: Connect to your existing Supabase project at `https://cqhqifnvvnwpgtsrgdky.supabase.co` rather than provisioning a new Lovable Cloud backend.

Given the scope, this will be built in phases. Each phase produces a working, testable slice — we'll review and iterate before moving to the next.

---

## Phase 0 — Connect to Your Supabase Project

Since you want to use an existing Supabase project (not Lovable Cloud's managed one), we'll need:

1. **Supabase URL**: `https://cqhqifnvvnwpgtsrgdky.supabase.co` ✓
2. **Supabase anon (publishable) key** — you'll need to paste this from your Supabase dashboard → Settings → API
3. **Service role key** (optional, only if we need admin server operations) — kept as a server-only secret

You'll connect the project via Lovable's Supabase Integration panel. Once connected, the generated client files (`@/integrations/supabase/client`, `client.server`, `auth-middleware`) will point at your project.

> Note: native Lovable Cloud features (one-click DB editor, managed migrations) won't apply — we'll run SQL directly in your Supabase SQL editor for schema setup.

---

## Phase 1 — Schema, Auth & Storage (run in your Supabase SQL editor)

**Tables** (matching your spec)
- `profiles`, `sections`, `videos`, `inquiries`, `site_settings`
- `user_roles` + `app_role` enum + `has_role()` SECURITY DEFINER function (admin role separate from profiles to prevent privilege escalation)

**RLS policies**
- Public: SELECT visible sections/videos/profile/settings; INSERT only on inquiries
- Admin: full CRUD via `has_role(auth.uid(), 'admin')`

**Storage buckets** (public read, admin write)
- `videos` (500MB), `thumbnails` (5MB), `avatars` (10MB), `covers` (20MB)

**Auth**
- Email/password enabled in your Supabase dashboard
- First signup → admin role via DB trigger (single-tenant portfolio)

I'll provide ready-to-run SQL for everything above.

---

## Phase 2 — Public Portfolio (Visitor Experience)

**Routes** (TanStack Start file-based)
- `/` — Hero + About + Portfolio + Featured Reel + Services + Contact + Footer
- Per-section SEO metadata via `head()`

**Hero** — full-screen dark gradient, Framer Motion staggered name reveal, typewriter tagline, two CTAs, optional autoplay-muted showreel background, scroll-down indicator

**Portfolio grid** — horizontal category tabs from `sections` + "All", responsive grid (1/2/3/4 cols), hover scale + glow, featured cards span 2, click → modal player with prev/next

**Video embed system** (`videoEmbedUtils.ts`)
- Auto-detects YouTube, Vimeo, Google Drive, Loom, Dailymotion, direct files
- `<VideoPlayer>` renders correct iframe or HTML5 `<video>`

**About / Stats / Services / Social** — driven by `profiles` + `site_settings`

**Contact form** — React Hook Form + Zod, project type chips, budget select, deadline picker, inserts into `inquiries`

**Animations** — AOS.js global init (duration 800, ease-out-cubic, mirror) with `data-aos` attributes per your spec; Framer Motion for hero + modal + page transitions

---

## Phase 3 — Admin Panel

**Layout** — Protected `/admin/*` routes (redirect to `/admin/login` if not admin); shadcn collapsible sidebar: Dashboard, Videos, Sections, Settings, Inquiries, Profile

**Dashboard** — stat cards (videos, views, new inquiries, active sections, storage), recent inquiries, quick actions

**Videos manager**
- Sortable table with thumbnail, title, section, type badge, views, visibility
- Add/edit slide-over with source toggle (Upload vs Paste Link)
  - Upload: drag-drop to Supabase Storage with progress
  - Link: URL input, auto-detect, preview thumbnail
- Drag-and-drop reorder via `@dnd-kit`

**Sections manager** — drag-drop card grid, icon picker (Lucide), color picker, cover upload, auto-slug, delete-blocked-if-has-videos

**Inquiries inbox** — expandable rows, status flow (New → Reviewing → Replied → Archived), admin notes

**Site Settings** (tabs): Hero · Brand (live color preview via CSS vars) · About · Social · Services · Contact

---

## Phase 4 — Polish

- Loading skeletons, empty states with illustration
- Scroll-to-top button (after 500px), navbar blur/darken on scroll
- Mobile hamburger slide-out, lazy images, blur-up thumbnails
- `AnimatePresence` page transitions
- SEO meta from `site_settings`, sonner toasts on save/submit
- Mobile QA at 375 / 768 / 1280

---

## Technical Stack

TanStack Start (existing), Tailwind v4, shadcn/ui, Framer Motion, AOS, `@dnd-kit`, React Hook Form + Zod, Lucide, sonner

---

## Suggested Build Order

1. **Phase 0** — Connect Supabase (need your anon key)
2. **Phase 1** — Run SQL for schema + RLS + buckets
3. **Phase 2** — Public site with sample data
4. **Phase 3** — Admin CRUD
5. **Phase 4** — Polish & ship

**To start**: please paste your Supabase **anon/publishable key** (from Supabase dashboard → Settings → API → "Project API keys" → `anon` `public`). Then approve this plan and I'll begin Phase 0/1.