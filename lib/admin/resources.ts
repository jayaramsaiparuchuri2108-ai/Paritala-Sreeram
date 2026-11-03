import en from "@/data/translations/en";
import te from "@/data/translations/te";
import type { CollectionName } from "@/lib/validation/schemas";
import { ACTIVITY_CATEGORIES, GALLERY_CATEGORIES, type Bi, type SettingsKey } from "@/types";

// Client-safe admin configuration: which fields each section edits and how it is listed.

export type FieldType =
  | "text"
  | "textarea"
  | "bi-text"
  | "bi-textarea"
  | "select"
  | "poster-category"
  | "date"
  | "image"
  | "images"
  | "url"
  | "sources"
  | "tags"
  | "bool";

export interface FieldDef {
  name: string;
  label: Bi;
  type: FieldType;
  options?: { value: string; label: Bi }[];
  help?: Bi;
  required?: boolean;
  folder?: "posters" | "gallery" | "site";
  max?: number;
  /** Image fields: record the uploaded file's pixel size as `width` / `height` and file it by category and title. */
  trackSize?: boolean;
  /** Bool fields: labels shown beside the switch (defaults to Published / Draft). */
  boolLabels?: { on: Bi; off: Bi };
}

export interface ResourceDef {
  slug: string;
  collection: CollectionName;
  title: Bi;
  description: Bi;
  fields: FieldDef[];
  /** Field names used to render each row. */
  titleField: string;
  subtitleField?: string;
  imageField?: string;
  /** Show the multi-photograph uploader above the list (gallery). */
  bulkUpload?: boolean;
  reorderable: boolean;
  defaults: Record<string, unknown>;
}

const L = (en: string, te: string): Bi => ({ en, te });

const categoryOptions = ACTIVITY_CATEGORIES.map((c) => ({ value: c, label: L(en.activities.cat[c], te.activities.cat[c]) }));
const galleryCategoryOptions = GALLERY_CATEGORIES.map((c) => ({ value: c, label: L(en.gallery.cat[c], te.gallery.cat[c]) }));
const published: FieldDef = { name: "published", label: L("Published", "ప్రచురితం"), type: "bool" };
const sourceIds: FieldDef = {
  name: "sourceIds",
  label: L("Source IDs", "ఆధార IDలు"),
  type: "sources",
  help: L("Comma separated, e.g. S04, S05 — see research/source-registry.json", "కామాతో వేరు చేయండి, ఉదా. S04, S05 — research/source-registry.json చూడండి"),
};

export const resources: ResourceDef[] = [
  {
    slug: "posters",
    collection: "posters",
    title: L(en.admin.posters, te.admin.posters),
    description: L("Upload, edit, publish and reorder posters. Use the Poster designer to create new ones.", "పోస్టర్లను అప్‌లోడ్ చేయండి, సవరించండి, ప్రచురించండి, క్రమం మార్చండి."),
    titleField: "title",
    subtitleField: "category",
    imageField: "image",
    reorderable: true,
    defaults: { published: true, tags: [] },
    fields: [
      { name: "title", label: L("Title", "శీర్షిక"), type: "bi-text", required: true },
      { name: "category", label: L("Category", "వర్గం"), type: "poster-category", required: true },
      { name: "image", label: L("Poster image (1080×1350 recommended)", "పోస్టర్ చిత్రం (1080×1350 సూచన)"), type: "image", folder: "posters", required: true },
      { name: "alt", label: L("Image description (alt text)", "చిత్ర వివరణ (alt)"), type: "bi-text" },
      { name: "tags", label: L("Tags", "ట్యాగ్‌లు"), type: "tags", help: L("Comma separated; used by poster search.", "కామాతో వేరు చేయండి; పోస్టర్ శోధనకు ఉపయోగపడతాయి.") },
      published,
    ],
  },
  {
    slug: "categories",
    collection: "posterCategories",
    title: L(en.admin.categories, te.admin.categories),
    description: L("Categories used to filter posters.", "పోస్టర్లను వడపోసే వర్గాలు."),
    titleField: "name",
    reorderable: true,
    defaults: { published: true },
    fields: [{ name: "name", label: L("Name", "పేరు"), type: "bi-text", required: true }, published],
  },
  {
    slug: "activities",
    collection: "activities",
    title: L(en.admin.activities, te.admin.activities),
    description: L("Meetings, village visits, trust programmes and more. Add a source link for every entry.", "సభలు, గ్రామ పర్యటనలు, ట్రస్ట్ కార్యక్రమాలు మొదలైనవి. ప్రతి నమోదుకు ఆధార లింక్ ఇవ్వండి."),
    titleField: "title",
    subtitleField: "date",
    imageField: "image",
    reorderable: true,
    defaults: { published: true, category: "public-meetings" },
    fields: [
      { name: "category", label: L("Category", "వర్గం"), type: "select", options: categoryOptions, required: true },
      { name: "title", label: L("Title", "శీర్షిక"), type: "bi-text", required: true },
      { name: "description", label: L("Description", "వివరణ"), type: "bi-textarea", required: true },
      { name: "date", label: L("Date", "తేదీ"), type: "date" },
      { name: "location", label: L("Location", "ప్రదేశం"), type: "bi-text" },
      { name: "image", label: L("Photograph (authorised only)", "ఫోటో (అనుమతి ఉన్నవి మాత్రమే)"), type: "image", folder: "gallery" },
      { name: "imageAlt", label: L("Image description (alt text)", "చిత్ర వివరణ (alt)"), type: "bi-text" },
      { name: "sourceName", label: L("Source name", "ఆధారం పేరు"), type: "text" },
      { name: "sourceUrl", label: L("Source URL", "ఆధార URL"), type: "url" },
      published,
    ],
  },
  {
    slug: "timeline",
    collection: "timeline",
    title: L(en.admin.timeline, te.admin.timeline),
    description: L("Chronological milestones shown on the About page.", "పరిచయం పేజీలో చూపే కాలక్రమ ఘట్టాలు."),
    titleField: "title",
    subtitleField: "year",
    reorderable: true,
    defaults: { published: true, sourceIds: [] },
    fields: [
      { name: "year", label: L("Year", "సంవత్సరం"), type: "text", required: true },
      { name: "date", label: L("Exact date (optional)", "ఖచ్చితమైన తేదీ (ఐచ్ఛికం)"), type: "date" },
      { name: "title", label: L("Title", "శీర్షిక"), type: "bi-text", required: true },
      { name: "body", label: L("Description", "వివరణ"), type: "bi-textarea", required: true },
      sourceIds,
      published,
    ],
  },
  {
    slug: "biography",
    collection: "bio",
    title: L(en.admin.biography, te.admin.biography),
    description: L("Biography sections on the About page. Separate paragraphs with a blank line.", "పరిచయం పేజీలోని జీవిత చరిత్ర విభాగాలు. పేరాల మధ్య ఖాళీ లైన్ ఉంచండి."),
    titleField: "title",
    subtitleField: "key",
    reorderable: true,
    defaults: { published: true, sourceIds: [], key: "" },
    fields: [
      { name: "key", label: L("Section key (intro, education, …)", "విభాగ కీ (intro, education, …)"), type: "text", required: true },
      { name: "title", label: L("Title", "శీర్షిక"), type: "bi-text", required: true },
      { name: "body", label: L("Text", "వచనం"), type: "bi-textarea", required: true },
      { name: "image", label: L("Photograph for the home page (authorised only)", "హోమ్ పేజీ కోసం ఫోటో (అనుమతి ఉన్నవి మాత్రమే)"), type: "image", folder: "site" },
      { name: "imageAlt", label: L("Image description (alt text)", "చిత్ర వివరణ (alt)"), type: "bi-text" },
      sourceIds,
      published,
    ],
  },
  {
    slug: "focus",
    collection: "focus",
    title: L(en.admin.focus, te.admin.focus),
    description: L(
      "Numbered 'Areas of Focus' on the home page. Informational categories only — never promises or claims of completed work. Add a description only after it is approved.",
      "హోమ్ పేజీలోని సంఖ్యల 'ప్రాధాన్య అంశాలు'. సమాచార వర్గాలు మాత్రమే — హామీలు లేదా పూర్తయిన పనుల వాదనలు కావు. ఆమోదం తర్వాత మాత్రమే వివరణ చేర్చండి.",
    ),
    titleField: "title",
    reorderable: true,
    defaults: { published: true },
    fields: [
      { name: "title", label: L("Title", "శీర్షిక"), type: "bi-text", required: true },
      { name: "description", label: L("Approved description (optional)", "ఆమోదించిన వివరణ (ఐచ్ఛికం)"), type: "bi-textarea" },
      published,
    ],
  },
  {
    slug: "electoral",
    collection: "electoral",
    title: L(en.admin.electoral, te.admin.electoral),
    description: L("Election participation table. Update the 2026 row only when the result is officially confirmed.", "ఎన్నికల పట్టిక. అధికారికంగా ధృవీకరించిన తర్వాత మాత్రమే 2026 అడ్డు వరుసను నవీకరించండి."),
    titleField: "election",
    subtitleField: "year",
    reorderable: true,
    defaults: { published: true, sourceIds: [], party: "TDP" },
    fields: [
      { name: "year", label: L("Year", "సంవత్సరం"), type: "text", required: true },
      { name: "election", label: L("Election", "ఎన్నిక"), type: "bi-text", required: true },
      { name: "party", label: L("Party", "పార్టీ"), type: "text" },
      { name: "outcome", label: L("Outcome", "ఫలితం"), type: "bi-text", required: true },
      { name: "detail", label: L("Details", "వివరాలు"), type: "bi-textarea" },
      sourceIds,
      published,
    ],
  },
  {
    slug: "updates",
    collection: "updates",
    title: L(en.admin.updates, te.admin.updates),
    description: L("Latest public updates on the home page. Always cite the publication.", "హోమ్ పేజీలోని తాజా ప్రజా సమాచారం. ప్రచురణ వివరాలు తప్పనిసరిగా ఇవ్వండి."),
    titleField: "title",
    subtitleField: "date",
    reorderable: true,
    defaults: { published: true },
    fields: [
      { name: "date", label: L("Date", "తేదీ"), type: "date", required: true },
      { name: "title", label: L("Headline", "శీర్షిక"), type: "bi-text", required: true },
      { name: "body", label: L("Summary", "సారాంశం"), type: "bi-textarea" },
      { name: "image", label: L("Thumbnail photograph (authorised only)", "థంబ్‌నెయిల్ ఫోటో (అనుమతి ఉన్నవి మాత్రమే)"), type: "image", folder: "gallery" },
      { name: "imageAlt", label: L("Image description (alt text)", "చిత్ర వివరణ (alt)"), type: "bi-text" },
      { name: "sourceName", label: L("Publication", "ప్రచురణ"), type: "text" },
      { name: "sourceUrl", label: L("Article URL", "వ్యాస URL"), type: "url" },
      published,
    ],
  },
  {
    slug: "gallery",
    collection: "gallery",
    title: L(en.admin.gallery, te.admin.gallery),
    description: L(
      "Real photographs shown on the public Gallery and across the site. Upload several at once, then complete each one: caption, verified date, original post link and permission. A photograph only goes public when it is marked Authorised and Published.",
      "సైట్‌లో, గ్యాలరీలో చూపే నిజమైన ఫోటోలు. ఒకేసారి అనేకం అప్‌లోడ్ చేసి, ప్రతి ఫోటోకు వివరణ, ధృవీకరించిన తేదీ, అసలు పోస్ట్ లింక్, అనుమతి నమోదు చేయండి. 'అనుమతి ఉంది' మరియు 'ప్రచురితం' రెండూ ఉంటేనే ఫోటో ప్రజలకు కనిపిస్తుంది.",
    ),
    titleField: "title",
    subtitleField: "category",
    imageField: "image",
    bulkUpload: true,
    reorderable: true,
    defaults: { published: false, category: "recent", permission: "pending", allowDownload: false, featured: false },
    fields: [
      { name: "image", label: L("Photograph", "ఫోటో"), type: "image", folder: "gallery", required: true, trackSize: true, help: L("Stored by category with a descriptive filename. The original file is kept untouched; the site serves optimised copies.", "వర్గం వారీగా వివరణాత్మక పేరుతో నిల్వ అవుతుంది. అసలు ఫైల్ మార్పు లేకుండా ఉంటుంది; సైట్ ఆప్టిమైజ్ చేసిన కాపీలను చూపుతుంది.") },
      { name: "title", label: L("Title", "శీర్షిక"), type: "bi-text", required: true },
      { name: "caption", label: L("Caption (original wording only)", "క్యాప్షన్ (అసలు పదాలే)"), type: "bi-textarea", help: L("Copy the original caption if there is one. Do not invent or embellish.", "అసలు క్యాప్షన్ ఉంటే అదే రాయండి. కల్పించకండి.") },
      { name: "category", label: L("Category", "వర్గం"), type: "select", options: galleryCategoryOptions, required: true },
      { name: "alt", label: L("Image description (alt text)", "చిత్ర వివరణ (alt)"), type: "bi-text", help: L("Describe what is visible, for screen readers. Required before publishing.", "కనిపించేది వివరించండి (స్క్రీన్ రీడర్ల కోసం). ప్రచురించే ముందు తప్పనిసరి.") },
      { name: "date", label: L("Event date (only if verified)", "కార్యక్రమ తేదీ (ధృవీకరించినదే)"), type: "date" },
      { name: "sourceUrl", label: L("Original post URL", "అసలు పోస్ట్ URL"), type: "url", help: L("Shown as a small 'Original post' link in the viewer.", "వ్యూయర్‌లో చిన్న 'అసలు పోస్ట్' లింక్‌గా కనిపిస్తుంది.") },
      { name: "credit", label: L("Credit / permission holder", "క్రెడిట్ / అనుమతి ఇచ్చినవారు"), type: "text" },
      {
        name: "permission",
        label: L("Permission to publish", "ప్రచురణ అనుమతి"),
        type: "select",
        options: [
          { value: "pending", label: L("Pending — not cleared yet", "పెండింగ్ — ఇంకా అనుమతి లేదు") },
          { value: "authorised", label: L("Authorised — rights holder has approved", "అనుమతి ఉంది — హక్కుదారు ఆమోదించారు") },
        ],
        required: true,
      },
      { name: "allowDownload", label: L("Allow visitors to download", "సందర్శకులు డౌన్‌లోడ్ చేయడానికి అనుమతి"), type: "bool", boolLabels: { on: L("Download allowed", "డౌన్‌లోడ్ అనుమతి"), off: L("No download", "డౌన్‌లోడ్ లేదు") } },
      { name: "featured", label: L("Featured photograph", "ప్రత్యేక ఫోటో"), type: "bool", boolLabels: { on: L("Featured", "ప్రత్యేకం"), off: L("Not featured", "ప్రత్యేకం కాదు") } },
      published,
    ],
  },
  {
    slug: "instagram",
    collection: "instagram",
    title: L(en.admin.instagram, te.admin.instagram),
    description: L(en.admin.instagramHelp, te.admin.instagramHelp),
    titleField: "url",
    reorderable: true,
    defaults: { published: true },
    fields: [
      { name: "url", label: L("Instagram post / reel URL", "ఇన్‌స్టాగ్రామ్ పోస్ట్ / రీల్ URL"), type: "url", required: true },
      published,
    ],
  },
  {
    slug: "videos",
    collection: "videos",
    title: L(en.admin.videos, te.admin.videos),
    description: L("Authorised YouTube links or original public video URLs.", "అనుమతి ఉన్న YouTube లింకులు లేదా అసలు పబ్లిక్ వీడియో URLలు."),
    titleField: "title",
    subtitleField: "url",
    reorderable: true,
    defaults: { published: true },
    fields: [
      { name: "title", label: L("Title", "శీర్షిక"), type: "bi-text", required: true },
      { name: "url", label: L("Video URL (https)", "వీడియో URL (https)"), type: "url", required: true },
      { name: "description", label: L("Description", "వివరణ"), type: "bi-textarea" },
      published,
    ],
  },
];

export function getResource(slug: string): ResourceDef | undefined {
  return resources.find((r) => r.slug === slug);
}

// ---------------------------------------------------------------- settings

export interface SettingsDef {
  slug: string;
  key: SettingsKey;
  title: Bi;
  description: Bi;
  fields: FieldDef[];
}

export const settingsGroups: SettingsDef[] = [
  {
    slug: "home",
    key: "home",
    title: L(en.admin.home, te.admin.home),
    description: L("Hero portraits (authorised photographs only; two or more will crossfade) and intro text.", "హీరో చిత్రాలు (అనుమతి ఉన్న ఫోటోలు మాత్రమే; రెండు అంతకంటే ఎక్కువ ఉంటే మారుతూ కనిపిస్తాయి), పరిచయ వచనం."),
    fields: [
      { name: "heroImages", label: L("Hero portraits", "హీరో చిత్రాలు"), type: "images", folder: "site", max: 6 },
      { name: "heroImageAlt", label: L("Portrait description (alt text)", "చిత్ర వివరణ (alt)"), type: "bi-text" },
      { name: "heroIntro", label: L("Intro text", "పరిచయ వచనం"), type: "bi-textarea" },
    ],
  },
  {
    slug: "site",
    key: "site",
    title: L(en.admin.site, te.admin.site),
    description: L("Name, designation and the independence notice shown in the footer.", "పేరు, హోదా, ఫుటర్‌లో చూపే స్వతంత్ర వెబ్‌సైట్ గమనిక."),
    fields: [
      { name: "name", label: L("Name", "పేరు"), type: "bi-text", required: true },
      { name: "designation", label: L("Current designation", "ప్రస్తుత హోదా"), type: "bi-text" },
      { name: "tagline", label: L("Tagline", "ట్యాగ్‌లైన్"), type: "bi-text" },
      { name: "disclaimer", label: L("Footer notice", "ఫుటర్ గమనిక"), type: "bi-textarea" },
    ],
  },
  {
    slug: "seo",
    key: "seo",
    title: L(en.admin.seo, te.admin.seo),
    description: L("Default title, description and share image used by search engines and social previews.", "శోధన యంత్రాలు, సోషల్ ప్రివ్యూలకు ఉపయోగపడే డిఫాల్ట్ శీర్షిక, వివరణ, షేర్ చిత్రం."),
    fields: [
      { name: "title", label: L("Default title", "డిఫాల్ట్ శీర్షిక"), type: "bi-text" },
      { name: "description", label: L("Default description", "డిఫాల్ట్ వివరణ"), type: "bi-textarea" },
      { name: "keywords", label: L("Keywords", "కీవర్డ్స్"), type: "text" },
      { name: "ogImage", label: L("Share image (1200×630)", "షేర్ చిత్రం (1200×630)"), type: "image", folder: "site" },
    ],
  },
  {
    slug: "social",
    key: "social",
    title: L(en.admin.social, te.admin.social),
    description: L("Official profile links. Leave blank to hide a channel.", "అధికారిక ప్రొఫైల్ లింకులు. దాచడానికి ఖాళీగా ఉంచండి."),
    fields: [
      { name: "instagram", label: L("Instagram URL", "ఇన్‌స్టాగ్రామ్ URL"), type: "url" },
      { name: "telegram", label: L("Telegram URL", "టెలిగ్రామ్ URL"), type: "url" },
      { name: "facebook", label: L("Facebook URL", "ఫేస్‌బుక్ URL"), type: "url" },
      { name: "x", label: L("X (Twitter) URL", "ఎక్స్ URL"), type: "url" },
      { name: "youtube", label: L("YouTube URL", "యూట్యూబ్ URL"), type: "url" },
      { name: "whatsapp", label: L("WhatsApp channel/link", "వాట్సాప్ లింక్"), type: "url" },
    ],
  },
  {
    slug: "contact",
    key: "contact",
    title: L(en.admin.contact, te.admin.contact),
    description: L("Only publish contact details that have been approved for public display.", "ప్రజలకు చూపడానికి ఆమోదించిన సంప్రదింపు వివరాలను మాత్రమే ప్రచురించండి."),
    fields: [
      { name: "email", label: L("Public email", "పబ్లిక్ ఈమెయిల్"), type: "text" },
      { name: "phone", label: L("Public phone", "పబ్లిక్ ఫోన్"), type: "text" },
      { name: "address", label: L("Office address", "కార్యాలయ చిరునామా"), type: "bi-textarea" },
      { name: "note", label: L("Note", "గమనిక"), type: "bi-textarea" },
    ],
  },
];

export function getSettingsGroup(slug: string): SettingsDef | undefined {
  return settingsGroups.find((s) => s.slug === slug);
}
