import { Redis } from "@upstash/redis";
import fs from "node:fs";
import path from "node:path";

/**
 * Storage adapter. Production uses Upstash Redis. When Upstash is not configured and NODE_ENV is not
 * "production", a JSON file in .data/ is used so the whole app can be developed and tested locally.
 *
 * NOTE: this file (and password.ts) deliberately uses relative imports and erasable TypeScript only,
 * because scripts/create-admin.ts runs them directly with Node's type stripping.
 */

export class StoreNotConfiguredError extends Error {
  constructor() {
    super("Database is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.");
    this.name = "StoreNotConfiguredError";
  }
}

export type Doc = Record<string, unknown>;

export interface Store {
  mode: "upstash" | "local";
  list(collection: string): Promise<Doc[]>;
  get(collection: string, id: string): Promise<Doc | null>;
  put(collection: string, id: string, doc: Doc): Promise<void>;
  remove(collection: string, id: string): Promise<void>;
  kvGet<T = unknown>(key: string): Promise<T | null>;
  kvSet(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
  kvDel(key: string): Promise<void>;
  incr(key: string, ttlSeconds: number): Promise<number>;
}

const NS = "ps";

function hasUpstashEnv(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function isCloudStoreConfigured(): boolean {
  return hasUpstashEnv();
}

/** True if any store can be used (cloud, or the local dev file store outside production). */
export function isStoreAvailable(): boolean {
  return hasUpstashEnv() || process.env.NODE_ENV !== "production";
}

// ---------------------------------------------------------------- Upstash

function createUpstashStore(): Store {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL as string,
    token: process.env.UPSTASH_REDIS_REST_TOKEN as string,
  });
  const hashKey = (c: string) => `${NS}:c:${c}`;
  const kvKey = (k: string) => `${NS}:kv:${k}`;

  return {
    mode: "upstash",
    async list(collection) {
      const all = await redis.hgetall<Record<string, Doc>>(hashKey(collection));
      return all ? Object.values(all) : [];
    },
    async get(collection, id) {
      return (await redis.hget<Doc>(hashKey(collection), id)) ?? null;
    },
    async put(collection, id, doc) {
      await redis.hset(hashKey(collection), { [id]: doc });
    },
    async remove(collection, id) {
      await redis.hdel(hashKey(collection), id);
    },
    async kvGet<T>(key: string) {
      return ((await redis.get<T>(kvKey(key))) ?? null) as T | null;
    },
    async kvSet(key, value, ttlSeconds) {
      if (ttlSeconds) await redis.set(kvKey(key), value, { ex: ttlSeconds });
      else await redis.set(kvKey(key), value);
    },
    async kvDel(key) {
      await redis.del(kvKey(key));
    },
    async incr(key, ttlSeconds) {
      const k = kvKey(`rl:${key}`);
      const n = await redis.incr(k);
      if (n === 1) await redis.expire(k, ttlSeconds);
      return n;
    },
  };
}

// ------------------------------------------------------------ Local file

interface LocalDb {
  collections: Record<string, Record<string, Doc>>;
  kv: Record<string, { v: unknown; exp?: number }>;
}

function createLocalStore(): Store {
  const dir = path.join(process.cwd(), ".data");
  const file = path.join(dir, "db.json");
  let cache: LocalDb | null = null;
  let chain: Promise<unknown> = Promise.resolve();

  function load(): LocalDb {
    if (cache) return cache;
    try {
      cache = JSON.parse(fs.readFileSync(file, "utf8")) as LocalDb;
    } catch {
      cache = { collections: {}, kv: {} };
    }
    return cache;
  }
  function save() {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(load(), null, 2));
  }
  function run<T>(fn: () => T): Promise<T> {
    const next = chain.then(fn);
    chain = next.catch(() => undefined);
    return next;
  }
  function liveKv(key: string) {
    const db = load();
    const entry = db.kv[key];
    if (!entry) return null;
    if (entry.exp && entry.exp < Date.now()) {
      delete db.kv[key];
      return null;
    }
    return entry;
  }

  return {
    mode: "local",
    list: (c) => run(() => Object.values(load().collections[c] ?? {})),
    get: (c, id) => run(() => load().collections[c]?.[id] ?? null),
    put: (c, id, doc) =>
      run(() => {
        const db = load();
        (db.collections[c] ??= {})[id] = doc;
        save();
      }),
    remove: (c, id) =>
      run(() => {
        const db = load();
        if (db.collections[c]) delete db.collections[c][id];
        save();
      }),
    kvGet: <T,>(key: string) => run(() => (liveKv(key)?.v ?? null) as T | null),
    kvSet: (key, value, ttl) =>
      run(() => {
        load().kv[key] = { v: value, exp: ttl ? Date.now() + ttl * 1000 : undefined };
        save();
      }),
    kvDel: (key) =>
      run(() => {
        delete load().kv[key];
        save();
      }),
    incr: (key, ttl) =>
      run(() => {
        const k = `rl:${key}`;
        const current = liveKv(k);
        const n = (typeof current?.v === "number" ? current.v : 0) + 1;
        load().kv[k] = { v: n, exp: current?.exp ?? Date.now() + ttl * 1000 };
        save();
        return n;
      }),
  };
}

// Kept on globalThis so route handlers and pages share one store even when the dev bundler gives each its own module copy.
const globalStore = globalThis as typeof globalThis & { __psStore?: Store };

export function getStore(): Store {
  if (globalStore.__psStore) return globalStore.__psStore;
  if (hasUpstashEnv()) globalStore.__psStore = createUpstashStore();
  else if (process.env.NODE_ENV !== "production") globalStore.__psStore = createLocalStore();
  else throw new StoreNotConfiguredError();
  return globalStore.__psStore;
}
