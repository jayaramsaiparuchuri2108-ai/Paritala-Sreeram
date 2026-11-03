import { ActivityExplorer } from "@/components/activities/ActivityExplorer";
import { PageHero } from "@/components/shared/PageHero";
import { publicList } from "@/lib/database/content";
import { getDict } from "@/lib/i18n";
import { getLang } from "@/lib/lang-server";
import { pageMetadata } from "@/lib/seo";
import type { Activity } from "@/types";

export async function generateMetadata() {
  return pageMetadata({ path: "/activities", navKey: "activities" });
}

export default async function ActivitiesPage() {
  const t = getDict(await getLang());
  const activities = await publicList<Activity>("activities");
  return (
    <>
      <PageHero title={t.activities.title} lead={t.activities.lead} />
      <section className="container-x py-16 md:py-24">
        <ActivityExplorer activities={activities} />
      </section>
    </>
  );
}
