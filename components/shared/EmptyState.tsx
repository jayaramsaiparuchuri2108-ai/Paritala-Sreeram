import type { ReactNode } from "react";

export function EmptyState({ children, icon, dark }: { children: ReactNode; icon?: ReactNode; dark?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-3 border border-dashed px-6 py-14 text-center ${
        dark ? "border-white/25 bg-white/[0.03] text-white/60" : "border-ink/25 bg-cream/70 text-stone"
      }`}
    >
      {icon}
      <p className="max-w-md text-sm md:text-base">{children}</p>
    </div>
  );
}
