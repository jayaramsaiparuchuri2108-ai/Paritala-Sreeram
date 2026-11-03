import { AdminShell } from "@/components/admin/AdminShell";
import { Dashboard } from "@/components/admin/Dashboard";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";

export default async function AdminHome() {
  const t = getDict(await getLang());
  return (
    <AdminShell title={t.admin.dashboard}>
      <Dashboard />
    </AdminShell>
  );
}
