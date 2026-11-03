import type { ReactNode } from "react";
import { Reveal } from "@/components/animations/Reveal";

export function PageHero({ title, lead, eyebrow, children }: { title: string; lead?: string; eyebrow?: string; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-cream pt-32 pb-14 md:pt-40 md:pb-20">
      <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand md:h-[26rem] md:w-[26rem]" />
      <div aria-hidden className="stripes absolute bottom-0 right-10 hidden h-20 w-48 opacity-10 md:block" />
      <div className="container-x relative">
        <Reveal>
          {eyebrow && (
            <p className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em]">
              <span className="h-[3px] w-10 bg-ink" /> {eyebrow}
            </p>
          )}
          <h1 className="font-display text-5xl uppercase leading-[1.02] md:text-7xl">{title}</h1>
          {lead && <p className="mt-5 max-w-2xl text-base text-ink/75 md:text-lg">{lead}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  );
}
