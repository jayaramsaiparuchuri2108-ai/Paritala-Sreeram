import { randomUUID } from "node:crypto";
import {
  defaultSettings,
  seedActivities,
  seedBio,
  seedElectoral,
  seedFocus,
  seedInstagram,
  seedPosterCategories,
  seedTimeline,
  seedUpdates,
} from "@/data/seed";
import { getStore, isStoreAvailable } from "@/lib/database/store";
import type { CollectionName } from "@/lib/validation/schemas";
import type { Settings, SettingsKey } from "@/types";

type AnyDoc = { id: string; order: number; published: boolean } & Record<string, unknown>;

const seeds: Record<CollectionName, AnyDoc[]> = {
  activities: seedActivities as unknown as AnyDoc[],
  timeline: seedTimeline as unknown as AnyDoc[],
  bio: seedBio as unknown as AnyDoc[],
  focus: seedFocus as unknown as AnyDoc[],
  electoral: seedElectoral as unknown as AnyDoc[],
  updates: seedUpdates as unknown as AnyDoc[],
  posterCategories: seedPosterCategories as unknown as AnyDoc[],
  instagram: seedInstagram as unknown as AnyDoc[],
  posters: [],
  gallery: [],
  videos: [],
  posterTemplates: [],
};

/** New items appear at the top for these collections. */
const newFirst = new Set<CollectionName>(["posters", "gallery", "updates"]);

const byOrder = (a: AnyDoc, b: AnyDoc) => (a.order ?? 0) - (b.order ?? 0);
const markerKey = (name: string) => `init:${name}`;

async function isInitialised(name: CollectionName): Promise<boolean> {
  return Boolean(await getStore().kvGet(markerKey(name)));
}

/**
 * Admin read: the first time a collection is opened, the default content is copied into the database so
 * it can be edited. Returns every item including drafts.
 */
export async function adminList<T = AnyDoc>(name: CollectionName): Promise<T[]> {
  const store = getStore();
  if (!(await isInitialised(name))) {
    for (const doc of seeds[name]) await store.put(name, doc.id, doc);
    await store.kvSet(markerKey(name), true);
  }
  const docs = (await store.list(name)) as AnyDoc[];
  return docs.sort(byOrder) as unknown as T[];
}

/** Public read: published items only. Falls back to the bundled defaults if the DB is unavailable or untouched. */
export async function publicList<T = AnyDoc>(name: CollectionName): Promise<T[]> {
  let docs: AnyDoc[] = seeds[name];
  if (isStoreAvailable()) {
    try {
      if (await isInitialised(name)) docs = (await getStore().list(name)) as AnyDoc[];
    } catch (error) {
      console.error(`[content] falling back to seed for "${name}":`, error);
    }
  }
  return docs.filter((d) => d.published !== false).sort(byOrder) as unknown as T[];
}

export async function publicGet<T = AnyDoc>(name: CollectionName, id: string): Promise<T | null> {
  const all = await publicList<AnyDoc>(name);
  return (all.find((d) => d.id === id) as unknown as T) ?? null;
}

export async function createDoc(name: CollectionName, data: Record<string, unknown>): Promise<AnyDoc> {
  const existing = await adminList(name);
  const orders = existing.map((d) => d.order ?? 0);
  const order = typeof data.order === "number" ? data.order : newFirst.has(name) ? Math.min(0, ...orders) - 1 : Math.max(0, ...orders) + 1;
  const doc = {
    ...data,
    id: `${name.slice(0, 3)}-${randomUUID().slice(0, 12)}`,
    order,
    ...(name === "posters" ? { downloads: 0, createdAt: new Date().toISOString() } : {}),
  } as AnyDoc;
  await getStore().put(name, doc.id, doc);
  return doc;
}

export async function updateDoc(name: CollectionName, id: string, data: Record<string, unknown>): Promise<AnyDoc | null> {
  await adminList(name);
  const current = (await getStore().get(name, id)) as AnyDoc | null;
  if (!current) return null;
  const doc = { ...current, ...data, id, order: typeof data.order === "number" ? data.order : current.order } as AnyDoc;
  await getStore().put(name, id, doc);
  return doc;
}

export async function removeDoc(name: CollectionName, id: string): Promise<AnyDoc | null> {
  await adminList(name);
  const current = (await getStore().get(name, id)) as AnyDoc | null;
  if (!current) return null;
  await getStore().remove(name, id);
  return current;
}

export async function reorderDocs(name: CollectionName, ids: string[]): Promise<void> {
  const store = getStore();
  const docs = await adminList(name);
  const byId = new Map(docs.map((d) => [d.id, d]));
  let position = 1;
  for (const id of ids) {
    const doc = byId.get(id);
    if (!doc) continue;
    await store.put(name, id, { ...doc, order: position++ });
  }
}

export async function incrementPosterDownloads(id: string): Promise<void> {
  try {
    const store = getStore();
    const doc = (await store.get("posters", id)) as AnyDoc | null;
    if (doc) await store.put("posters", id, { ...doc, downloads: Number(doc.downloads ?? 0) + 1 });
  } catch (error) {
    console.error("[content] download counter failed", error);
  }
}

// ---------------------------------------------------------------- settings

function mergeSettings<K extends SettingsKey>(key: K, stored: unknown): Settings[K] {
  const base = defaultSettings[key] as unknown as Record<string, unknown>;
  const incoming = (stored && typeof stored === "object" ? stored : {}) as Record<string, unknown>;
  return { ...base, ...incoming } as unknown as Settings[K];
}

export async function getSettings(): Promise<Settings> {
  const result = { ...defaultSettings } as Settings;
  if (!isStoreAvailable()) return result;
  try {
    const store = getStore();
    for (const key of Object.keys(defaultSettings) as SettingsKey[]) {
      const stored = await store.kvGet(`settings:${key}`);
      (result[key] as unknown) = mergeSettings(key, stored);
    }
  } catch (error) {
    console.error("[content] settings fallback to defaults:", error);
  }
  return result;
}

export async function saveSettings<K extends SettingsKey>(key: K, value: Settings[K]): Promise<void> {
  await getStore().kvSet(`settings:${key}`, value);
}
