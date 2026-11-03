import registry from "@/research/source-registry.json";

export interface SourceRecord {
  id: string;
  title: string;
  publisher: string;
  url: string;
  published: string;
  accessed: string;
  type: string;
  note?: string;
}

export const sources: SourceRecord[] = registry.sources as SourceRecord[];
const index = new Map(sources.map((s) => [s.id, s]));

export function sourceById(id: string): SourceRecord | undefined {
  return index.get(id);
}
