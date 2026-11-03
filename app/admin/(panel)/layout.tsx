import { redirect } from "next/navigation";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { getSession } from "@/lib/auth/session";
import { isCloudStoreConfigured } from "@/lib/database/store";

// Every page under /admin (except /admin/login) requires a valid server-side session.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return (
    <AdminProvider email={session.email} csrf={session.csrf} cloud={isCloudStoreConfigured() && Boolean(process.env.BLOB_READ_WRITE_TOKEN)}>
      {children}
    </AdminProvider>
  );
}
