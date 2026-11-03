"use client";

import { ExternalLink } from "lucide-react";
import { motion } from "motion/react";
import { InstagramEmbed } from "@/components/gallery/InstagramEmbed";
import { staggerChild, staggerParent } from "@/components/animations/Reveal";
import { useLang } from "@/components/shared/Providers";
import { EmptyState } from "@/components/shared/EmptyState";
import type { InstagramPost } from "@/types";

export function InstagramGrid({ posts, limit, dark }: { posts: InstagramPost[]; limit?: number; dark?: boolean }) {
  const { t } = useLang();
  const shown = limit ? posts.slice(0, limit) : posts;
  if (shown.length === 0) return <EmptyState dark={dark}>{t.gallery.emptyInstagram}</EmptyState>;

  return (
    <motion.ul
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {shown.map((p) => (
        <motion.li key={p.id} variants={staggerChild} className="flex flex-col gap-2">
          <InstagramEmbed url={p.url} />
          <a href={p.url} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1.5 self-start text-xs font-semibold ${dark ? "text-white/60 hover:text-brand" : "text-ink/70 hover:text-ink"}`}>
            {t.common.openOriginal} <ExternalLink className="h-3 w-3" />
          </a>
        </motion.li>
      ))}
    </motion.ul>
  );
}
