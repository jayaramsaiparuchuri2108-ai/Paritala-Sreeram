import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/animations/Reveal";

interface Props {
  eyebrow?: string;
  title: string;
  lead?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  dark?: boolean;
}

export function SectionHeading({ eyebrow, title, lead, href, linkLabel, align = "left", dark }: Props) {
  return (
    <Reveal className={`mb-10 flex flex-col gap-4 md:mb-14 ${align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={align === "center" ? "max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <p className={`mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] ${dark ? "text-brand" : "text-ink"}`}>
            <span className="h-[3px] w-10 bg-brand" /> {eyebrow}
          </p>
        )}
        <h2 className={`font-display text-4xl uppercase leading-[1.05] md:text-6xl ${dark ? "text-white" : "text-ink"}`}>{title}</h2>
        {lead && <p className={`mt-4 text-base md:text-lg ${dark ? "text-white/70" : "text-stone"}`}>{lead}</p>}
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className={`group inline-flex shrink-0 items-center gap-2 text-sm font-bold ${dark ? "text-brand" : "text-ink"}`}
        >
          <span className="border-b-2 border-brand pb-0.5">{linkLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </Reveal>
  );
}
