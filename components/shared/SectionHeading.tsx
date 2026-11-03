import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Reveal } from "@/components/animations/Reveal";

interface Props {
  eyebrow?: string;
  title: string;
  lead?: string;
  href?: string;
  linkLabel?: string;
  align?: "left" | "center";
  /** Shorthand for tone="dark". */
  dark?: boolean;
  /** Surface the heading sits on: light (white / off-white), dark (black) or brand (yellow). */
  tone?: "light" | "dark" | "brand";
}

export function SectionHeading({ eyebrow, title, lead, href, linkLabel, align = "left", dark, tone }: Props) {
  const surface = tone ?? (dark ? "dark" : "light");
  const eyebrowColor = surface === "dark" ? "text-brand" : "text-ink";
  const titleColor = surface === "dark" ? "text-white" : "text-ink";
  const leadColor = surface === "dark" ? "text-white/65" : surface === "brand" ? "text-ink/75" : "text-stone";
  const linkColor = surface === "dark" ? "text-brand" : "text-ink";
  return (
    <Reveal className={`mb-10 flex flex-col gap-5 md:mb-14 ${align === "center" ? "items-center text-center" : "md:flex-row md:items-end md:justify-between md:gap-10"}`}>
      <div className="max-w-3xl">
        {eyebrow && <p className={`eyebrow mb-5 ${eyebrowColor}`}>{eyebrow}</p>}
        <h2 className={`font-display text-4xl font-bold leading-[1.05] md:text-6xl ${titleColor}`}>{title}</h2>
        {lead && <p className={`mt-5 max-w-2xl text-base leading-relaxed md:text-lg ${leadColor}`}>{lead}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className={`group inline-flex shrink-0 items-center gap-2 text-sm font-semibold ${linkColor}`}>
          <span className="link-line pb-0.5">{linkLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </Reveal>
  );
}
