import type { ReactNode } from "react";

export function EmptyState({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-line bg-cream/60 px-6 py-14 text-center text-stone">
      {icon}
      <p className="max-w-md text-sm md:text-base">{children}</p>
    </div>
  );
}
