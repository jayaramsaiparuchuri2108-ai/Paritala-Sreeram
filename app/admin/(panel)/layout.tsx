import { redirect } from "next/navigation";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSession } from "@/lib/auth/session";
import { isCloudStoreConfigured } from "@/lib/database/store";

// Every page under /admin (except /admin/login) requires a valid server-side session.
// The shell lives here so the sidebar persists (and keeps its collapsed state) between pages.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return (
    <AdminProvider email={session.email} csrf={session.csrf} cloud={isCloudStoreConfigured() && Boolean(process.env.BLOB_READ_WRITE_TOKEN)}>
      <AdminShell>{children}</AdminShell>
    </AdminProvider>
  );
}
