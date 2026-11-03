import type { ReactNode } from "react";
import { Reveal } from "@/components/animations/Reveal";

/** Black editorial banner that opens every inner page. */
export function PageHero({ title, lead, eyebrow, children }: { title: string; lead?: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <section className="on-dark relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="absolute -right-24 top-0 hidden h-full w-[38%] bg-brand/[0.07] lg:block" />
      <div aria-hidden className="absolute bottom-0 left-0 h-px w-full bg-white/10" />
      <div className="container-x relative py-16 md:py-24">
        <Reveal>
          {eyebrow && <p className="eyebrow mb-6 text-brand">{eyebrow}</p>}
          <h1 className="max-w-4xl font-display text-5xl font-bold leading-[1.04] md:text-7xl">{title}</h1>
          <div className="mt-7 h-1 w-20 bg-brand" />
          {lead && <p className="mt-7 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">{lead}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
