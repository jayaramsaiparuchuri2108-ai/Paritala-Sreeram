import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getStore } from "@/lib/database/store";

export const SESSION_COOKIE = "ps_admin";
const SESSION_TTL = 60 * 60 * 8; // 8 hours

export interface AdminSession {
  id: string;
  email: string;
  csrf: string;
}

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET is missing or shorter than 32 characters.");
  }
  return s;
}

function sign(id: string): string {
  return createHmac("sha256", secret()).update(id).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function createSession(email: string): Promise<void> {
  const id = randomBytes(32).toString("base64url");
  const csrf = randomBytes(24).toString("base64url");
  await getStore().kvSet(`sess:${id}`, { email, csrf, createdAt: Date.now() }, SESSION_TTL);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

/** Validates the signed cookie AND the server-side session record on every call. */
export async function getSession(): Promise<AdminSession | null> {
  const jar = await cookies();
  try {
    const raw = jar.get(SESSION_COOKIE)?.value;
    if (!raw) return null;
    const [id, sig] = raw.split(".");
    if (!id || !sig || !safeEqual(sig, sign(id))) return null;
    const record = await getStore().kvGet<{ email: string; csrf: string }>(`sess:${id}`);
    if (!record) return null;
    return { id, email: record.email, csrf: record.csrf };
  } catch (error) {
    console.error("[auth] session check failed", error);
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  const id = raw?.split(".")[0];
  if (id) {
    try {
      await getStore().kvDel(`sess:${id}`);
    } catch {
      /* cookie is cleared regardless */
    }
  }
  jar.delete(SESSION_COOKIE);
}

export function verifyCsrf(session: AdminSession, header: string | null): boolean {
  return Boolean(header) && safeEqual(header as string, session.csrf);
}
