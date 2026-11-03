import { notFound } from "next/navigation";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { PosterDesignerPage } from "@/components/admin/PosterDesignerPage";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getResource, getSettingsGroup } from "@/lib/admin/resources";

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;

  if (section === "designer") return <PosterDesignerPage />;
  const resource = getResource(section);
  if (resource) return section === "gallery" ? <GalleryManager resource={resource} /> : <ResourceManager resource={resource} />;
  const group = getSettingsGroup(section);
  if (group) return <SettingsForm group={group} />;
  notFound();
}
