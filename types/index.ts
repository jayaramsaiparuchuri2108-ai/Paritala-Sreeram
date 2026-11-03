export type Lang = "en" | "te";
export const LANGS: Lang[] = ["en", "te"];

/** Structured bilingual text. Every user-facing string is stored this way. */
export type Bi = { en: string; te: string };

interface Base {
  id: string;
  published: boolean;
  order: number;
}

export type ActivityCategory =
  | "public-meetings"
  | "village-visits"
  | "public-interactions"
  | "social"
  | "trust"
  | "party"
  | "events";

export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  "public-meetings",
  "village-visits",
  "public-interactions",
  "social",
  "trust",
  "party",
  "events",
];

export interface Activity extends Base {
  category: ActivityCategory;
  title: Bi;
  description: Bi;
  date?: string;
  location?: Bi;
  image?: string;
  imageAlt?: Bi;
  sourceName?: string;
  sourceUrl?: string;
}

export interface TimelineEvent extends Base {
  year: string;
  date?: string;
  title: Bi;
  body: Bi;
  sourceIds: string[];
}

export interface BioSection extends Base {
  key: string;
  title: Bi;
  body: Bi;
  sourceIds: string[];
}

export interface ElectoralRow extends Base {
  year: string;
  election: Bi;
  party: string;
  outcome: Bi;
  detail: Bi;
  sourceIds: string[];
}

export interface UpdateItem extends Base {
  date: string;
  title: Bi;
  body: Bi;
  sourceName?: string;
  sourceUrl?: string;
}

export interface PosterCategory extends Base {
  name: Bi;
}

export interface Poster extends Base {
  title: Bi;
  category: string;
  image: string;
  alt?: Bi;
  tags: string[];
  downloads: number;
  createdAt: string;
}

export interface GalleryPhoto extends Base {
  title: Bi;
  category: string;
  image: string;
  alt: Bi;
  credit: string;
}

export interface InstagramPost extends Base {
  url: string;
  caption?: Bi;
}

export interface VideoEntry extends Base {
  title: Bi;
  description?: Bi;
  url: string;
  youtubeId?: string;
}

// ---------- Poster editor ----------

export type LayerKind = "text" | "image" | "logo" | "shape";

export interface TextLayer {
  id: string;
  kind: "text";
  text: string;
  x: number;
  y: number;
  width: number;
  size: number;
  font: string;
  weight: number;
  color: string;
  align: "left" | "center" | "right";
  lineHeight: number;
  uppercase?: boolean;
}

export interface ImageLayer {
  id: string;
  kind: "image";
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fit: "cover" | "contain";
  radius?: number;
  zoom?: number;
  panX?: number;
  panY?: number;
}

export interface LogoLayer {
  id: string;
  kind: "logo";
  x: number;
  y: number;
  size: number;
}

export interface ShapeLayer {
  id: string;
  kind: "shape";
  shape: "rect" | "circle" | "band";
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  rotation?: number;
}

export type PosterLayer = TextLayer | ImageLayer | LogoLayer | ShapeLayer;

export interface PosterBackground {
  type: "solid" | "gradient" | "image";
  color: string;
  color2?: string;
  angle?: number;
  src?: string;
}

export interface PosterTemplate extends Base {
  name: Bi;
  background: PosterBackground;
  layers: PosterLayer[];
  custom?: boolean;
}

// ---------- Settings ----------

export interface SiteSettings {
  name: Bi;
  tagline: Bi;
  designation: Bi;
  disclaimer: Bi;
}

export interface SocialSettings {
  instagram: string;
  telegram: string;
  facebook: string;
  x: string;
  youtube: string;
  whatsapp: string;
}

export interface ContactSettings {
  email: string;
  phone: string;
  address: Bi;
  note: Bi;
}

export interface SeoSettings {
  title: Bi;
  description: Bi;
  keywords: string;
  ogImage: string;
}

export interface HomeSettings {
  heroImages: string[];
  heroImageAlt: Bi;
  heroIntro: Bi;
}

export interface Settings {
  site: SiteSettings;
  social: SocialSettings;
  contact: ContactSettings;
  seo: SeoSettings;
  home: HomeSettings;
}

export type SettingsKey = keyof Settings;
export const SETTINGS_KEYS: SettingsKey[] = ["site", "social", "contact", "seo", "home"];
