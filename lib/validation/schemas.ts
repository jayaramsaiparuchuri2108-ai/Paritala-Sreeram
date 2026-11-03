import { z } from "zod";
import { ACTIVITY_CATEGORIES, GALLERY_CATEGORIES } from "@/types";
import { isAllowedAssetUrl, isHttpsUrl, normalizeInstagramUrl, parseYoutubeId } from "./urls";

const text = (max: number) => z.string().trim().max(max);
export const biSchema = (max = 4000) => z.object({ en: text(max), te: text(max) });
const biRequired = (max = 4000) =>
  z.object({ en: text(max), te: text(max) }).refine((v) => v.en.length > 0 || v.te.length > 0, {
    message: "Provide English or Telugu text",
  });

const assetUrl = z.string().refine(isAllowedAssetUrl, "Image must be an uploaded file");
const optionalAsset = z.union([z.literal(""), assetUrl]).optional();
const optionalHttps = z.union([z.literal(""), z.string().refine(isHttpsUrl, "Must be an https URL")]).optional();
const isoDate = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Use YYYY-MM-DD")]).optional();
const sourceIds = z.array(z.string().regex(/^S\d{2,3}$/)).max(20).default([]);
const common = { published: z.boolean().default(true), order: z.number().int().optional() };

export const collectionSchemas = {
  activities: z.object({
    ...common,
    category: z.enum(ACTIVITY_CATEGORIES as [string, ...string[]]),
    title: biRequired(200),
    description: biRequired(3000),
    date: isoDate,
    location: biSchema(200).optional(),
    image: optionalAsset,
    imageAlt: biSchema(300).optional(),
    sourceName: text(120).optional(),
    sourceUrl: optionalHttps,
  }),
  timeline: z.object({
    ...common,
    year: text(12).min(1),
    date: isoDate,
    title: biRequired(200),
    body: biRequired(2000),
    sourceIds,
  }),
  bio: z.object({
    ...common,
    key: text(40).min(1),
    title: biRequired(200),
    body: biRequired(6000),
    image: optionalAsset,
    imageAlt: biSchema(300).optional(),
    sourceIds,
  }),
  focus: z.object({
    ...common,
    title: biRequired(120),
    description: biSchema(600),
  }),
  electoral: z.object({
    ...common,
    year: text(12).min(1),
    election: biRequired(200),
    party: text(40),
    outcome: biRequired(200),
    detail: biSchema(1000),
    sourceIds,
  }),
  updates: z.object({
    ...common,
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}/),
    title: biRequired(200),
    body: biSchema(1500),
    image: optionalAsset,
    imageAlt: biSchema(300).optional(),
    sourceName: text(120).optional(),
    sourceUrl: optionalHttps,
  }),
  posterCategories: z.object({ ...common, name: biRequired(80) }),
  posters: z.object({
    ...common,
    title: biRequired(160),
    category: text(60).min(1),
    image: assetUrl,
    alt: biSchema(300).optional(),
    tags: z.array(text(30)).max(15).default([]),
  }),
  gallery: z
    .object({
      ...common,
      title: biRequired(160),
      caption: biSchema(800).optional(),
      category: z.enum(GALLERY_CATEGORIES),
      image: assetUrl,
      width: z.number().int().min(1).max(20000).optional(),
      height: z.number().int().min(1).max(20000).optional(),
      alt: biSchema(300),
      date: isoDate,
      sourceUrl: optionalHttps,
      credit: text(160).default(""),
      permission: z.enum(["authorised", "pending"]).default("pending"),
      allowDownload: z.boolean().default(false),
      featured: z.boolean().default(false),
    })
    .superRefine((v, ctx) => {
      // A photograph can be saved as a draft at any time, but only goes public once it is cleared and described.
      if (!v.published) return;
      if (v.permission !== "authorised") ctx.addIssue({ code: "custom", path: ["permission"], message: "Only authorised photographs can be published" });
      if (!v.alt.en && !v.alt.te) ctx.addIssue({ code: "custom", path: ["alt"], message: "Add an image description (alt text) before publishing" });
    }),
  instagram: z.object({
    ...common,
    url: z
      .string()
      .transform((v) => normalizeInstagramUrl(v))
      .refine((v): v is string => v !== null, "Enter a public Instagram post or reel URL"),
    caption: biSchema(300).optional(),
  }),
  videos: z.object({
    ...common,
    title: biRequired(160),
    description: biSchema(800).optional(),
    url: z.string().refine(isHttpsUrl, "Must be an https URL"),
  }),
  posterTemplates: z.object({
    ...common,
    name: biRequired(80),
    background: z.object({
      type: z.enum(["solid", "gradient", "image"]),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      color2: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      angle: z.number().optional(),
      src: z.string().optional(),
    }),
    layers: z.array(z.record(z.string(), z.unknown())).max(60),
  }),
} as const;

export type CollectionName = keyof typeof collectionSchemas;
export const COLLECTION_NAMES = Object.keys(collectionSchemas) as CollectionName[];

export function isCollectionName(v: string): v is CollectionName {
  return (COLLECTION_NAMES as string[]).includes(v);
}

/** Extra normalisation after schema parsing. */
export function postProcess(name: CollectionName, data: Record<string, unknown>): Record<string, unknown> {
  if (name === "videos") {
    const id = parseYoutubeId(String(data.url));
    return { ...data, youtubeId: id ?? undefined };
  }
  return data;
}

// ---------------------------------------------------------------- settings

const colorUrl = optionalHttps;
export const settingsSchemas = {
  site: z.object({
    name: biRequired(120),
    tagline: biSchema(240),
    designation: biSchema(160),
    disclaimer: biSchema(600),
  }),
  social: z.object({
    instagram: colorUrl.default(""),
    telegram: colorUrl.default(""),
    facebook: colorUrl.default(""),
    x: colorUrl.default(""),
    youtube: colorUrl.default(""),
    whatsapp: colorUrl.default(""),
  }),
  contact: z.object({
    email: z.union([z.literal(""), z.string().email().max(160)]).default(""),
    phone: text(30).default(""),
    address: biSchema(400),
    note: biSchema(400),
  }),
  seo: z.object({
    title: biSchema(120),
    description: biSchema(300),
    keywords: text(300).default(""),
    ogImage: optionalAsset.default(""),
  }),
  home: z.object({
    heroImages: z.array(assetUrl).max(6).default([]),
    heroImageAlt: biSchema(200),
    heroIntro: biSchema(300),
  }),
} as const;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(1).max(200),
});

export const reorderSchema = z.object({ ids: z.array(z.string().max(80)).max(500) });
