import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getSession } from "@/lib/auth/session";
import { isStoreAvailable } from "@/lib/database/store";

export default async function LoginPage() {
  if (!isStoreAvailable()) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream p-6">
        <div className="max-w-lg rounded-2xl border-2 border-ink bg-white p-6">
          <h1 className="font-display text-3xl uppercase">Admin is not configured</h1>
          <p className="mt-3 text-sm">
            Set <code>UPSTASH_REDIS_REST_URL</code>, <code>UPSTASH_REDIS_REST_TOKEN</code>, <code>BLOB_READ_WRITE_TOKEN</code> and{" "}
            <code>ADMIN_SESSION_SECRET</code> in the hosting environment, then create an admin user with <code>npm run admin:create</code>.
          </p>
        </div>
      </main>
    );
  }
  if (await getSession()) redirect("/admin");
  return <LoginForm />;
}
