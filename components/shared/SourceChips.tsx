import { ExternalLink } from "lucide-react";
import { sourceById } from "@/data/sources";

/** Small source references linked to the Sources & attribution page's registry. */
export function SourceChips({ ids, label }: { ids: string[]; label?: string }) {
  const resolved = ids.map((id) => sourceById(id)).filter((s): s is NonNullable<typeof s> => Boolean(s));
  if (resolved.length === 0) return null;
  return (
    <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone">
      {label && <span className="font-semibold uppercase tracking-wider">{label}:</span>}
      {resolved.map((s) => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`${s.title} — ${s.publisher}`}
          className="inline-flex items-center gap-1 border border-ink/20 bg-white px-2.5 py-1 font-medium text-ink/80 transition-colors hover:border-ink hover:bg-brand hover:text-ink"
        >
          {s.publisher}
          <ExternalLink className="h-3 w-3" />
        </a>
      ))}
    </p>
  );
}
