"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  /** Parallax travel of the inner image, in px. 0 disables it. */
  parallax?: number;
  from?: "bottom" | "left" | "right";
}

const clip = {
  bottom: "inset(100% 0 0 0)",
  left: "inset(0 100% 0 0)",
  right: "inset(0 0 0 100%)",
} as const;

/** Wipe-reveals an image block as it enters the viewport, with a gentle counter-parallax on its content. */
export function ImageReveal({ children, className, parallax = 28, from = "bottom" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [-parallax, parallax]);
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ clipPath: clip[from] }}
      whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1] }}
    >
      <motion.div className="absolute -inset-y-8 inset-x-0" style={{ y: parallax ? y : 0 }}>
        {children}
      </motion.div>
    </motion.div>
  );
}
