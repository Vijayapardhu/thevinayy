-- ============================================================================
-- FrameFolio Schema (run in Supabase SQL editor)
-- ============================================================================

-- Enums
create type public.app_role as enum ('admin', 'user');

-- ============================================================================
-- TABLES
-- ============================================================================

create table public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade unique,
  display_name  text not null,
  tagline       text,
  bio           text,
  avatar_url    text,
  showreel_url  text,
  primary_color text default '#7C3AED',
  accent_color  text default '#A78BFA',
  contact_email text,
  whatsapp      text,
  social_links  jsonb default '{}'::jsonb,
  services      text[] default '{}',
  is_available  boolean default true,
  created_at    timestamptz default now()
);

create table public.user_roles (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role    app_role not null,
  unique (user_id, role)
);

create table public.sections (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references public.profiles(id) on delete cascade,
  name         text not null,
  slug         text not null,
  description  text,
  icon         text default 'video',
  accent_color text default '#7C3AED',
  cover_url    text,
  sort_order   integer not null default 0,
  is_visible   boolean default true,
  created_at   timestamptz default now(),
  unique(profile_id, slug)
);

create table public.videos (
  id            uuid primary key default gen_random_uuid(),
  section_id    uuid references public.sections(id) on delete cascade,
  title         text not null,
  description   text,
  video_type    text check (video_type in ('upload','embed')) not null,
  video_url     text not null,
  embed_code    text,
  thumbnail_url text,
  duration      text,
  tags          text[] default '{}',
  is_featured   boolean default false,
  is_visible    boolean default true,
  sort_order    integer not null default 0,
  view_count    integer default 0,
  created_at    timestamptz default now()
);

create table public.inquiries (
  id              uuid primary key default gen_random_uuid(),
  profile_id      uuid references public.profiles(id) on delete set null,
  full_name       text not null,
  email           text not null,
  phone           text,
  project_type    text not null,
  budget_range    text,
  project_details text not null,
  reference_links text,
  deadline        date,
  status          text default 'new',
  admin_notes     text,
  created_at      timestamptz default now()
);

create table public.site_settings (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid references public.profiles(id) on delete cascade unique,
  hero_heading  text,
  hero_subtext  text,
  cta_text      text default 'View My Work',
  cta2_text     text default 'Contact Me',
  meta_title    text,
  meta_desc     text,
  bg_type       text default 'gradient',
  bg_value      text,
  project_types text[] default '{"Video Editing","Color Grading","Motion Graphics","Short Film","Promotional / Ad Video","Corporate Video","Social Media Content","AI-Generated Video","Video Shoot","Other"}',
  budget_ranges text[] default '{"Under $500","$500 - $1,000","$1,000 - $5,000","$5,000 - $10,000","$10,000+"}',
  footer_text   text,
  updated_at    timestamptz default now()
);

-- ============================================================================
-- ROLE HELPER (security definer to avoid RLS recursion)
-- ============================================================================

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- First user to sign up becomes admin (single-tenant portfolio)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table public.profiles      enable row level security;
alter table public.user_roles    enable row level security;
alter table public.sections      enable row level security;
alter table public.videos        enable row level security;
alter table public.inquiries     enable row level security;
alter table public.site_settings enable row level security;

-- profiles: public read, admin write
create policy "profiles public read" on public.profiles
  for select using (true);
create policy "profiles admin write" on public.profiles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- user_roles: users see own, admin sees all
create policy "user_roles self read" on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "user_roles admin manage" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- sections: public reads visible, admin full CRUD
create policy "sections public read visible" on public.sections
  for select using (is_visible = true or public.has_role(auth.uid(), 'admin'));
create policy "sections admin write" on public.sections
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- videos: public reads visible, admin full CRUD
create policy "videos public read visible" on public.videos
  for select using (is_visible = true or public.has_role(auth.uid(), 'admin'));
create policy "videos admin write" on public.videos
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- inquiries: anyone can submit, only admin reads/manages
create policy "inquiries public insert" on public.inquiries
  for insert with check (true);
create policy "inquiries admin read" on public.inquiries
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));
create policy "inquiries admin update" on public.inquiries
  for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "inquiries admin delete" on public.inquiries
  for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- site_settings: public read, admin write
create policy "site_settings public read" on public.site_settings
  for select using (true);
create policy "site_settings admin write" on public.site_settings
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('videos',     'videos',     true, 524288000, array['video/mp4','video/quicktime','video/webm']),
  ('thumbnails', 'thumbnails', true, 5242880,   array['image/jpeg','image/png','image/webp']),
  ('avatars',    'avatars',    true, 10485760,  array['image/jpeg','image/png','image/webp']),
  ('covers',     'covers',     true, 20971520,  array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- Storage policies: public read all, admin write all
create policy "storage public read" on storage.objects
  for select using (bucket_id in ('videos','thumbnails','avatars','covers'));

create policy "storage admin insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('videos','thumbnails','avatars','covers')
    and public.has_role(auth.uid(), 'admin')
  );

create policy "storage admin update" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('videos','thumbnails','avatars','covers')
    and public.has_role(auth.uid(), 'admin')
  );

create policy "storage admin delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('videos','thumbnails','avatars','covers')
    and public.has_role(auth.uid(), 'admin')
  );

-- ============================================================================
-- SEED: a default profile + site_settings (so public site has something to show)
-- ============================================================================

insert into public.profiles (display_name, tagline, bio, contact_email)
values ('Your Name', 'Video Editor & Storyteller', 'Crafting cinematic stories that move people.', 'hello@example.com')
on conflict do nothing;

insert into public.site_settings (profile_id, hero_heading, hero_subtext, footer_text)
select id, 'Cinematic stories, edited with intent.', 'Award-winning video editing for brands, creators, and filmmakers.', '© FrameFolio'
from public.profiles
limit 1
on conflict do nothing;
