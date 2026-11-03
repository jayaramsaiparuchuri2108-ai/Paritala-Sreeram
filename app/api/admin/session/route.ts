import { json, requireAdmin } from "@/lib/auth/guard";
import { isCloudStoreConfigured } from "@/lib/database/store";

export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (auth instanceof Response) return auth;
  return json({
    email: auth.email,
    csrf: auth.csrf,
    cloud: isCloudStoreConfigured() && Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  });
}
