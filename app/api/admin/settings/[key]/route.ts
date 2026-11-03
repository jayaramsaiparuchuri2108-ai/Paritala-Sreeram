import { fail, json, requireAdmin } from "@/lib/auth/guard";
import { getSettings, saveSettings } from "@/lib/database/content";
import { settingsSchemas } from "@/lib/validation/schemas";
import { SETTINGS_KEYS, type Settings, type SettingsKey } from "@/types";

type Ctx = { params: Promise<{ key: string }> };

function isKey(v: string): v is SettingsKey {
  return (SETTINGS_KEYS as string[]).includes(v);
}

export async function GET(req: Request, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { key } = await ctx.params;
  if (!isKey(key)) return fail("Unknown settings group", 404);
  return json({ value: (await getSettings())[key] });
}

export async function PUT(req: Request, ctx: Ctx) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  const { key } = await ctx.params;
  if (!isKey(key)) return fail("Unknown settings group", 404);

  const parsed = settingsSchemas[key].safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail("Validation failed", 422, { issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })) });
  await saveSettings(key, parsed.data as Settings[typeof key]);
  return json({ value: parsed.data });
}
