export type VideoType = "upload" | "embed";

export interface Profile {
  id: string;
  user_id: string | null;
  display_name: string;
  tagline: string | null;
  bio: string | null;
  avatar_url: string | null;
  showreel_url: string | null;
  primary_color: string;
  accent_color: string;
  contact_email: string | null;
  whatsapp: string | null;
  social_links: Record<string, string>;
  services: string[];
  is_available: boolean;
  created_at: string;
}

export interface Section {
  id: string;
  profile_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  accent_color: string;
  cover_url: string | null;
  sort_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  video_type: VideoType;
  video_url: string;
  embed_code: string | null;
  thumbnail_url: string | null;
  duration: string | null;
  tags: string[];
  is_featured: boolean;
  is_visible: boolean;
  sort_order: number;
  view_count: number;
  created_at: string;
}

export interface Inquiry {
  id: string;
  profile_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  project_type: string;
  budget_range: string | null;
  project_details: string;
  reference_links: string | null;
  deadline: string | null;
  status: "new" | "reviewing" | "replied" | "archived";
  admin_notes: string | null;
  created_at: string;
}

export interface SiteSettings {
  id: string;
  profile_id: string | null;
  hero_heading: string | null;
  hero_subtext: string | null;
  cta_text: string;
  cta2_text: string;
  meta_title: string | null;
  meta_desc: string | null;
  bg_type: string;
  bg_value: string | null;
  project_types: string[];
  budget_ranges: string[];
  footer_text: string | null;
  updated_at: string;
}
