import { FocusAreas } from "@/components/home/FocusAreas";
import { GalleryStrip } from "@/components/home/GalleryStrip";
import { Hero } from "@/components/home/Hero";
import { Intro } from "@/components/home/Intro";
import { NewsSection } from "@/components/home/NewsSection";
import { PosterBand } from "@/components/home/PosterBand";
import { SplitSection } from "@/components/home/SplitSection";
import { VideoGrid } from "@/components/videos/VideoGrid";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { getSettings, publicList } from "@/lib/database/content";
import { formatDate, getDict, pick } from "@/lib/i18n";
import { photoFor } from "@/lib/photos";
import { getLang } from "@/lib/lang-server";
import { jsonLd, pageMetadata } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site-url";
import type { Activity, BioSection, FocusArea, GalleryPhoto, Poster, UpdateItem, VideoEntry } from "@/types";

export async function generateMetadata() {
  return pageMetadata({ path: "/" });
}

const COMMUNITY_CATEGORIES: Activity["category"][] = ["trust", "social", "village-visits", "public-interactions"];

export default async function HomePage() {
  const lang = await getLang();
  const t = getDict(lang);
  const [settings, updates, bio, activities, videos, posters, focus, photos] = await Promise.all([
    getSettings(),
    publicList<UpdateItem>("updates"),
    publicList<BioSection>("bio"),
    publicList<Activity>("activities"),
    publicList<VideoEntry>("videos"),
    publicList<Poster>("posters"),
    publicList<FocusArea>("focus"),
    publicList<GalleryPhoto>("gallery"),
  ]);
  const section = (key: string) => bio.find((b) => b.key === key);
  const intro = section("intro") ?? bio[0];
  const background = section("background");
  const family = section("family");
  const journey = section("journey");
  const roles = section("roles");
  const latestPosters = [...posters].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const community = activities.find((a) => COMMUNITY_CATEGORIES.includes(a.category));

  // Each slot uses its own uploaded image if set; otherwise it takes a photograph from the matching gallery category.
  const portrait = photoFor(photos, ["portraits"], 1) ?? photoFor(photos, ["portraits"], 0);
  const journeyPhoto = photoFor(photos, ["political-activities"]);
  const rolesPhoto = photoFor(photos, ["public-meetings"]);
  const communityPhoto = photoFor(photos, ["community-visits"]);
  const heroImages = settings.home.heroImages.length > 0 ? settings.home.heroImages : photos.filter((p) => p.category === "portraits").slice(0, 3).map((p) => p.image);
  const alt = (b?: BioSection, fallback?: GalleryPhoto) => (b ? pick(b.imageAlt, lang) || pick(b.title, lang) : "") || (fallback ? pick(fallback.alt, lang) : "");
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: settings.site.name.en,
    alternateName: settings.site.name.te,
    url: absoluteUrl("/"),
    jobTitle: settings.site.designation.en,
    affiliation: { "@type": "Organization", name: "Telugu Desam Party" },
    sameAs: [settings.social.instagram, settings.social.telegram].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(personLd) }} />
      <Hero name={settings.site.name} designation={settings.site.designation} intro={settings.home.heroIntro} images={heroImages} imageAlt={settings.home.heroImageAlt} />

      <Intro intro={intro} education={section("education")} designation={settings.site.designation} />

      {background && (
        <SplitSection
          tone="dark"
          imageSide="left"
          eyebrow={t.home.sectionBackground}
          title={pick(background.title, lang)}
          body={[pick(background.body, lang), family ? pick(family.body, lang) : ""].filter(Boolean).join("\n\n")}
          image={background.image || portrait?.image}
          imageAlt={background.image ? alt(background) : portrait ? pick(portrait.alt, lang) : alt(background)}
          monogram="PS"
          cta={{ href: "/about", label: t.home.readFullBio }}
        />
      )}

      {journey && (
        <SplitSection
          tone="brand"
          imageSide="right"
          eyebrow={t.home.sectionJourney}
          title={pick(journey.title, lang)}
          body={pick(journey.body, lang)}
          image={journey.image || journeyPhoto?.image}
          imageAlt={journey.image ? alt(journey) : journeyPhoto ? pick(journeyPhoto.alt, lang) : alt(journey)}
          monogram="TDP"
          cta={{ href: "/about#timeline", label: t.about.timelineTitle }}
        />
      )}

      {roles && (
        <SplitSection
          tone="dark"
          imageSide="left"
          eyebrow={t.home.sectionRoles}
          title={pick(roles.title, lang)}
          body={pick(roles.body, lang)}
          image={roles.image || rolesPhoto?.image}
          imageAlt={roles.image ? alt(roles) : rolesPhoto ? pick(rolesPhoto.alt, lang) : alt(roles)}
          monogram="DV"
          meta={settings.site.designation[lang]}
        />
      )}

      {community && (
        <SplitSection
          tone="brand"
          imageSide="right"
          eyebrow={t.home.sectionCommunity}
          title={pick(community.title, lang)}
          body={pick(community.description, lang)}
          image={community.image || communityPhoto?.image}
          imageAlt={community.image ? pick(community.imageAlt, lang) || pick(community.title, lang) : communityPhoto ? pick(communityPhoto.alt, lang) : pick(community.title, lang)}
          monogram="PS"
          meta={community.date ? formatDate(community.date, lang) : undefined}
          cta={{ href: "/activities", label: t.nav.activities }}
        />
      )}

      <NewsSection activities={activities} updates={updates} />
      <FocusAreas areas={focus} />
      <GalleryStrip photos={photos} instagramUrl={settings.social.instagram} />

      {videos.length > 0 && (
        <section className="bg-white py-20 md:py-28">
          <div className="container-x">
            <SectionHeading eyebrow={t.nav.videos} title={t.home.videosTitle} lead={t.home.videosLead} href="/videos" linkLabel={t.common.viewAll} />
            <VideoGrid videos={videos} limit={3} />
          </div>
        </section>
      )}

      <PosterBand posters={latestPosters} />
    </>
  );
}
