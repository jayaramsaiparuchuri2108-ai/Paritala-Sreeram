import Image from "next/image";

interface Props {
  src?: string;
  alt: string;
  /** Visual treatment of the typographic fallback used when no authorised photograph has been uploaded. */
  tone?: "dark" | "brand";
  monogram?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * Fills its (relatively positioned) parent. Shows the authorised photograph when there is one; otherwise a
 * designed typographic panel — never a stand-in photograph.
 */
export function PhotoPanel({ src, alt, tone = "dark", monogram = "PS", sizes = "(max-width: 1024px) 100vw, 50vw", priority }: Props) {
  if (src) {
    return <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover object-top" />;
  }
  const dark = tone === "dark";
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden ${dark ? "bg-[#101010]" : "bg-ink"}`}>
      <div className={`absolute -right-[18%] -top-[12%] aspect-square w-[70%] rounded-full bg-brand`} />
      <div className="absolute inset-6 border border-white/15 md:inset-10" />
      <div className="absolute -bottom-8 -left-8 h-40 w-40 opacity-25 [background-image:repeating-linear-gradient(-45deg,#ffd600_0_2px,transparent_2px_12px)]" />
      <span className="absolute bottom-[12%] left-[10%] font-display text-[clamp(6rem,22vw,13rem)] font-bold leading-none text-white/95">{monogram}</span>
    </div>
  );
}
