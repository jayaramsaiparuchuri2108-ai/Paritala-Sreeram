import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PosterDesignerPage } from "@/components/admin/PosterDesignerPage";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getResource, getSettingsGroup } from "@/lib/admin/resources";
import { getDict, pick } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const lang = await getLang();
  const t = getDict(lang);

  if (section === "designer") {
    return (
      <AdminShell title={t.admin.designer}>
        <PosterDesignerPage />
      </AdminShell>
    );
  }
  const resource = getResource(section);
  if (resource) {
    return (
      <AdminShell title={pick(resource.title, lang)}>
        <ResourceManager resource={resource} />
      </AdminShell>
    );
  }
  const group = getSettingsGroup(section);
  if (group) {
    return (
      <AdminShell title={pick(group.title, lang)}>
        <SettingsForm group={group} />
      </AdminShell>
    );
  }
  notFound();
}
