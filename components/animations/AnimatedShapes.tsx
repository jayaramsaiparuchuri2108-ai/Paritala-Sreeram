"use client";

import { useEffect, useRef } from "react";

/**
 * Hero background shapes. CSS handles ambient float/drift; GSAP + ScrollTrigger adds scroll-linked parallax.
 * GSAP is imported lazily so it never blocks first paint, and is skipped under prefers-reduced-motion.
 */
export function AnimatedShapes() {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancelled || !root.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
          const speed = Number(el.dataset.speed ?? 0);
          gsap.to(el, {
            yPercent: speed * 40,
            ease: "none",
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: 0.6 },
          });
        });
      }, root);
      cleanup = () => ctx.revert();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <div ref={root} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div data-speed="-1.2" className="absolute -right-24 -top-24 h-[420px] w-[420px] md:h-[640px] md:w-[640px]">
        <div className="h-full w-full animate-float rounded-full bg-brand" />
      </div>
      <div data-speed="0.8" className="absolute -left-44 bottom-[8%] h-56 w-56 md:-left-32 md:h-80 md:w-80">
        <div className="h-full w-full animate-drift rounded-full border-[14px] border-ink/15 border-t-transparent border-l-transparent" />
      </div>
      <div data-speed="1.4" className="absolute bottom-10 right-[18%] h-24 w-24 md:h-32 md:w-32">
        <div className="stripes h-full w-full animate-float opacity-25" />
      </div>
      <div data-speed="-0.6" className="absolute left-[8%] top-[14%] h-5 w-5 rounded-full bg-ink" />
      <div data-speed="0.5" className="absolute bottom-[26%] left-[44%] h-3 w-3 rotate-45 bg-brand-deep" />
    </div>
  );
}
