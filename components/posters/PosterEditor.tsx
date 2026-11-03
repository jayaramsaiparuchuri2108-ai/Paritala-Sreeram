"use client";

import "@fontsource/noto-serif-telugu/400.css";
import "@fontsource/noto-serif-telugu/700.css";
import "@fontsource/anek-telugu/400.css";
import "@fontsource/anek-telugu/700.css";
import "@fontsource/ramabhadra/400.css";
import "@fontsource/mandali/400.css";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Check,
  Copy,
  Download,
  ImagePlus,
  Loader2,
  Save,
  Shapes,
  Trash2,
  Type,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { useLang } from "@/components/shared/Providers";
import { BLACK, builtInTemplates, POSTER_FONTS, POSTER_H, POSTER_W, YELLOW } from "@/data/poster-templates";
import { pick } from "@/lib/i18n";
import { hitTest, LOGO_SRC, renderPoster, type ImageMap, type PosterState } from "@/lib/poster/render";
import type { Bi, GalleryPhoto, PosterCategory, PosterLayer, PosterTemplate, ShapeLayer, TextLayer } from "@/types";

const uid = () => Math.random().toString(36).slice(2, 9);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const fieldCls = "w-full rounded-md border-2 border-ink/70 bg-white px-2 py-1.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-brand";

function fromTemplate(tpl: PosterTemplate): PosterState {
  return { background: clone(tpl.background), layers: (clone(tpl.layers) as PosterLayer[]).map((l) => ({ ...l, id: uid() })) };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return reject(new Error("Only JPG, PNG or WebP images are allowed."));
    if (file.size > 8 * 1024 * 1024) return reject(new Error("File is larger than 8 MB."));
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file."));
    r.readAsDataURL(file);
  });
}

function Num({ label, value, onChange, min, max, step = 1 }: { label: string; value: number; onChange: (n: number) => void; min?: number; max?: number; step?: number }) {
  return (
    <label className="block text-xs font-bold">
      {label}
      <div className="mt-1 flex items-center gap-2">
        {min !== undefined && max !== undefined && (
          <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="min-w-0 flex-1 accent-ink" />
        )}
        <input type="number" step={step} value={Math.round(value * 100) / 100} onChange={(e) => onChange(Number(e.target.value))} className={`${fieldCls} w-20`} />
      </div>
    </label>
  );
}

export function PosterEditor() {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images = useRef<ImageMap>(new Map());
  const drag = useRef<{ id: string; dx: number; dy: number } | null>(null);

  const [customTemplates, setCustomTemplates] = useState<PosterTemplate[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [categories, setCategories] = useState<PosterCategory[]>([]);
  const [state, setState] = useState<PosterState>(() => fromTemplate(builtInTemplates[0]));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState<"" | "export" | "save" | "template">("");
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [titleBi, setTitleBi] = useState<Bi>({ en: "", te: "" });
  const [templateName, setTemplateName] = useState<Bi>({ en: "", te: "" });
  const [category, setCategory] = useState("");

  const selected = state.layers.find((l) => l.id === selectedId) ?? null;

  // ------------------------------------------------------------ data
  useEffect(() => {
    api<{ items: PosterTemplate[] }>("/c/posterTemplates").then((r) => setCustomTemplates(r.items)).catch(() => undefined);
    api<{ items: GalleryPhoto[] }>("/c/gallery").then((r) => setGalleryPhotos(r.items.filter((p) => p.permission === "authorised"))).catch(() => undefined);
    api<{ items: PosterCategory[] }>("/c/posterCategories")
      .then((r) => {
        setCategories(r.items);
        setCategory((c) => c || r.items[0]?.id || "");
      })
      .catch(() => undefined);
  }, [api]);

  // ------------------------------------------------------------ assets
  const ensureImage = useCallback((src: string) => {
    if (!src || images.current.has(src)) return;
    const img = new window.Image();
    // Gallery photographs may live on another origin (Vercel Blob); CORS keeps the canvas exportable.
    if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => {
      images.current.set(src, img);
      setTick((n) => n + 1);
    };
    img.src = src;
  }, []);

  useEffect(() => {
    ensureImage(LOGO_SRC);
    if (state.background.src) ensureImage(state.background.src);
    state.layers.forEach((l) => l.kind === "image" && ensureImage(l.src));
  }, [state, ensureImage]);

  // Make sure every font/weight used is loaded (including the Telugu subset) before it is drawn.
  const fontKey = useMemo(
    () => state.layers.filter((l): l is TextLayer => l.kind === "text").map((l) => `${l.weight}|${l.font}|${l.text}`).join("§"),
    [state.layers],
  );
  useEffect(() => {
    let alive = true;
    const loads = state.layers
      .filter((l): l is TextLayer => l.kind === "text")
      .map((l) => document.fonts.load(`${l.weight} 40px "${l.font}"`, l.text || "A").catch(() => undefined));
    Promise.all(loads).then(() => alive && setTick((n) => n + 1));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontKey]);

  // ------------------------------------------------------------ drawing
  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const id = requestAnimationFrame(() => renderPoster(ctx, state, images.current, { preview: true, selectedId }));
    return () => cancelAnimationFrame(id);
  }, [state, selectedId, tick]);

  // ------------------------------------------------------------ editing helpers
  const patch = useCallback((id: string, changes: Partial<PosterLayer>) => {
    setState((s) => ({ ...s, layers: s.layers.map((l) => (l.id === id ? ({ ...l, ...changes } as PosterLayer) : l)) }));
  }, []);

  function addLayer(layer: PosterLayer) {
    setState((s) => ({ ...s, layers: [...s.layers, layer] }));
    setSelectedId(layer.id);
  }
  const addText = () =>
    addLayer({ id: uid(), kind: "text", text: "New text / కొత్త వచనం", x: 80, y: 200, width: 920, size: 80, font: "Noto Sans Telugu", weight: 700, color: BLACK, align: "left", lineHeight: 1.3 });
  const addImage = () => addLayer({ id: uid(), kind: "image", src: "", x: 240, y: 240, width: 600, height: 700, fit: "cover", radius: 0, zoom: 1, panX: 0, panY: 0 });
  const addLogo = () => addLayer({ id: uid(), kind: "logo", x: 60, y: 60, size: 140 });
  const addShape = (shape: ShapeLayer["shape"]) =>
    addLayer({ id: uid(), kind: "shape", shape, x: 100, y: 100, width: shape === "band" ? 1200 : 400, height: shape === "band" ? 140 : 400, color: YELLOW, opacity: 1, rotation: shape === "band" ? -10 : 0 });

  function move(id: string, delta: -1 | 1) {
    setState((s) => {
      const i = s.layers.findIndex((l) => l.id === id);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= s.layers.length) return s;
      const layers = [...s.layers];
      [layers[i], layers[j]] = [layers[j], layers[i]];
      return { ...s, layers };
    });
  }
  const remove = (id: string) => {
    setState((s) => ({ ...s, layers: s.layers.filter((l) => l.id !== id) }));
    setSelectedId(null);
  };
  const duplicate = (id: string) => {
    const src = state.layers.find((l) => l.id === id);
    if (!src) return;
    const copy = { ...clone(src), id: uid(), x: src.x + 30, y: src.y + 30 } as PosterLayer;
    addLayer(copy);
  };

  async function uploadInto(file: File, apply: (dataUrl: string) => void) {
    try {
      apply(await readAsDataUrl(file));
      setNotice(null);
    } catch (e) {
      setNotice({ ok: false, text: (e as Error).message });
    }
  }

  // ------------------------------------------------------------ pointer interaction
  function toCanvas(e: React.PointerEvent<HTMLCanvasElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * POSTER_W, y: ((e.clientY - r.top) / r.height) * POSTER_H };
  }
  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = toCanvas(e);
    const id = hitTest(ctx, state, p.x, p.y);
    setSelectedId(id);
    if (id) {
      const l = state.layers.find((x) => x.id === id)!;
      drag.current = { id, dx: p.x - l.x, dy: p.y - l.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  }
  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drag.current) return;
    const p = toCanvas(e);
    patch(drag.current.id, { x: Math.round(p.x - drag.current.dx), y: Math.round(p.y - drag.current.dy) });
  }
  const onPointerUp = () => {
    drag.current = null;
  };

  // ------------------------------------------------------------ export & save
  function renderToBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const off = document.createElement("canvas");
      off.width = POSTER_W;
      off.height = POSTER_H;
      const ctx = off.getContext("2d");
      if (!ctx) return reject(new Error("Canvas is not supported."));
      renderPoster(ctx, state, images.current, { preview: false });
      off.toBlob((b) => (b ? resolve(b) : reject(new Error("Export failed."))), "image/png");
    });
  }

  async function exportPng() {
    setBusy("export");
    try {
      await Promise.all(state.layers.filter((l): l is TextLayer => l.kind === "text").map((l) => document.fonts.load(`${l.weight} 40px "${l.font}"`, l.text)));
      const blob = await renderToBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `paritala-sreeram-poster-${Date.now()}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      setNotice({ ok: false, text: (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function saveToPosters() {
    if (!titleBi.en.trim() && !titleBi.te.trim()) return setNotice({ ok: false, text: t.admin.required + ": " + t.editor.posterTitleEn });
    if (!category) return setNotice({ ok: false, text: t.admin.required + ": " + t.editor.category });
    setBusy("save");
    setNotice(null);
    try {
      const blob = await renderToBlob();
      const form = new FormData();
      form.set("file", new File([blob], "poster.png", { type: "image/png" }));
      form.set("folder", "posters");
      const up = await api<{ url: string }>("/upload", { method: "POST", form });
      await api("/c/posters", { method: "POST", body: { title: titleBi, category, image: up.url, published: true, tags: [] } });
      setNotice({ ok: true, text: t.editor.saved });
    } catch (e) {
      setNotice({ ok: false, text: e instanceof ApiError ? e.message : (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function saveTemplate() {
    if (!templateName.en.trim() && !templateName.te.trim()) return setNotice({ ok: false, text: t.admin.required });
    setBusy("template");
    setNotice(null);
    try {
      // Uploaded photos are never stored in templates - only the frames.
      const layers = state.layers.map((l) => (l.kind === "image" ? { ...l, src: "" } : l));
      const background = state.background.type === "image" ? { type: "solid" as const, color: state.background.color } : state.background;
      const res = await api<{ item: PosterTemplate }>("/c/posterTemplates", { method: "POST", body: { name: templateName, background, layers, published: true } });
      setCustomTemplates((c) => [...c, res.item]);
      setNotice({ ok: true, text: t.editor.saved });
    } catch (e) {
      setNotice({ ok: false, text: e instanceof ApiError ? e.message : (e as Error).message });
    } finally {
      setBusy("");
    }
  }

  async function deleteTemplate(id: string) {
    if (!window.confirm(t.admin.confirmDelete)) return;
    await api(`/c/posterTemplates/${id}`, { method: "DELETE" }).catch(() => undefined);
    setCustomTemplates((c) => c.filter((x) => x.id !== id));
  }

  // ------------------------------------------------------------ UI pieces
  const layerName = (l: PosterLayer) =>
    l.kind === "text" ? l.text.slice(0, 24) || "Text" : l.kind === "image" ? `Photo${l.src ? "" : " (empty)"}` : l.kind === "logo" ? "TDP logo" : `Shape · ${l.shape}`;

  return (
    <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)_340px]">
      {/* Left: templates, background, add */}
      <div className="space-y-5 xl:order-1">
        <section className="rounded-xl border-2 border-ink bg-white p-4">
          <h3 className="mb-3 font-display text-xl uppercase">{t.editor.templates}</h3>
          <div className="flex flex-wrap gap-2 xl:flex-col">
            {[...builtInTemplates, ...customTemplates].map((tpl) => (
              <div key={tpl.id} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setState(fromTemplate(tpl));
                    setSelectedId(null);
                  }}
                  className="flex-1 rounded-lg border-2 border-ink px-3 py-2 text-left text-sm font-bold hover:bg-brand"
                >
                  {pick(tpl.name, lang)}
                </button>
                {tpl.custom !== false && !builtInTemplates.some((b) => b.id === tpl.id) && (
                  <button aria-label={t.admin.delete} onClick={() => deleteTemplate(tpl.id)} className="rounded p-1.5 text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border-2 border-ink bg-white p-4">
          <h3 className="mb-3 font-display text-xl uppercase">{t.editor.background}</h3>
          <div className="mb-3 grid grid-cols-3 gap-1 text-xs font-bold">
            {(["solid", "gradient", "image"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setState((s) => ({ ...s, background: { ...s.background, type } }))}
                className={`rounded-md border-2 border-ink px-2 py-1.5 ${state.background.type === type ? "bg-brand" : "bg-white"}`}
              >
                {t.editor[type]}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-bold">{t.editor.color}
              <input type="color" value={state.background.color} onChange={(e) => setState((s) => ({ ...s, background: { ...s.background, color: e.target.value } }))} className="mt-1 block h-9 w-full cursor-pointer rounded border-2 border-ink" />
            </label>
            {state.background.type === "gradient" && (
              <>
                <label className="block text-xs font-bold">{t.editor.color2}
                  <input type="color" value={state.background.color2 ?? "#ffffff"} onChange={(e) => setState((s) => ({ ...s, background: { ...s.background, color2: e.target.value } }))} className="mt-1 block h-9 w-full cursor-pointer rounded border-2 border-ink" />
                </label>
                <Num label="°" value={state.background.angle ?? 160} min={0} max={360} onChange={(n) => setState((s) => ({ ...s, background: { ...s.background, angle: n } }))} />
              </>
            )}
            {state.background.type === "image" && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-ink/50 p-2 text-xs font-bold">
                <ImagePlus className="h-4 w-4" /> {t.editor.uploadPhoto}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadInto(e.target.files[0], (src) => setState((s) => ({ ...s, background: { ...s.background, src } })))} />
              </label>
            )}
          </div>
        </section>

        <section className="rounded-xl border-2 border-ink bg-white p-4">
          <h3 className="mb-3 font-display text-xl uppercase">{t.editor.layers}</h3>
          <div className="mb-3 grid grid-cols-2 gap-2 text-xs font-bold">
            <button onClick={addText} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-2 py-2 text-brand"><Type className="h-4 w-4" />{t.editor.addText}</button>
            <button onClick={addImage} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-2 py-2 text-brand"><ImagePlus className="h-4 w-4" />{t.editor.addImage}</button>
            <button onClick={addLogo} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-2 py-2 text-brand"><Image src={LOGO_SRC} alt="" width={16} height={16} className="rounded-full" />{t.editor.addLogo}</button>
            <button onClick={() => addShape("band")} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-ink px-2 py-2 text-brand"><Shapes className="h-4 w-4" />{t.editor.addShape}</button>
          </div>
          <ul className="space-y-1">
            {[...state.layers].reverse().map((l) => (
              <li key={l.id}>
                <button onClick={() => setSelectedId(l.id)} className={`w-full truncate rounded-md border-2 px-2 py-1.5 text-left text-xs font-bold ${l.id === selectedId ? "border-ink bg-brand" : "border-transparent bg-mist"}`}>
                  {layerName(l)}
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Center: canvas */}
      <div className="xl:order-2">
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-stone">{t.editor.preview} · {POSTER_W}×{POSTER_H}</p>
        <div className="mx-auto w-full max-w-[560px] overflow-hidden rounded-xl border-[3px] border-ink bg-white shadow-[8px_8px_0_0_#f5d51c]">
          <canvas
            ref={canvasRef}
            width={POSTER_W}
            height={POSTER_H}
            className="block h-auto w-full cursor-move touch-none"
            style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            role="img"
            aria-label={t.editor.preview}
          />
        </div>
        <div className="mx-auto mt-4 flex max-w-[560px] flex-wrap gap-3">
          <button onClick={exportPng} disabled={busy !== ""} className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-brand disabled:opacity-60">
            {busy === "export" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} {busy === "export" ? t.editor.exporting : t.editor.exportPng}
          </button>
        </div>
        {notice && (
          <p role="status" className={`mx-auto mt-4 flex max-w-[560px] items-center gap-2 rounded-lg p-3 text-sm font-bold ${notice.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>
            {notice.ok && <Check className="h-4 w-4" />} {notice.text}
          </p>
        )}
      </div>

      {/* Right: properties + save */}
      <div className="space-y-5 xl:order-3">
        <section className="rounded-xl border-2 border-ink bg-white p-4">
          {!selected ? (
            <p className="text-sm text-stone">{t.editor.selectLayer}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1">
                <button title={t.editor.up} onClick={() => move(selected.id, 1)} className="rounded-md border-2 border-ink p-1.5 hover:bg-brand"><ArrowUp className="h-4 w-4" /></button>
                <button title={t.editor.down} onClick={() => move(selected.id, -1)} className="rounded-md border-2 border-ink p-1.5 hover:bg-brand"><ArrowDown className="h-4 w-4" /></button>
                <button title={t.editor.duplicate} onClick={() => duplicate(selected.id)} className="rounded-md border-2 border-ink p-1.5 hover:bg-brand"><Copy className="h-4 w-4" /></button>
                <button title={t.editor.delete} onClick={() => remove(selected.id)} className="rounded-md border-2 border-red-700 p-1.5 text-red-700 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
              </div>

              {selected.kind === "text" && (
                <>
                  <label className="block text-xs font-bold">{t.editor.text}
                    <textarea value={selected.text} onChange={(e) => patch(selected.id, { text: e.target.value })} rows={3} className={`${fieldCls} mt-1`} />
                  </label>
                  <label className="block text-xs font-bold">{t.editor.font}
                    <select value={selected.font} onChange={(e) => patch(selected.id, { font: e.target.value })} className={`${fieldCls} mt-1`}>
                      {POSTER_FONTS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-bold">{t.editor.weight}
                      <select value={selected.weight} onChange={(e) => patch(selected.id, { weight: Number(e.target.value) })} className={`${fieldCls} mt-1`}>
                        {[400, 700, 800].map((w) => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </label>
                    <label className="block text-xs font-bold">{t.editor.color}
                      <input type="color" value={selected.color} onChange={(e) => patch(selected.id, { color: e.target.value })} className="mt-1 block h-[34px] w-full cursor-pointer rounded border-2 border-ink" />
                    </label>
                  </div>
                  <Num label={t.editor.size} value={selected.size} min={16} max={260} onChange={(n) => patch(selected.id, { size: n })} />
                  <Num label={t.editor.width} value={selected.width} min={80} max={POSTER_W} onChange={(n) => patch(selected.id, { width: n })} />
                  <Num label={t.editor.lineHeight} value={selected.lineHeight} min={0.9} max={2} step={0.05} onChange={(n) => patch(selected.id, { lineHeight: n })} />
                  <div className="flex gap-1" role="group" aria-label={t.editor.align}>
                    {([["left", AlignLeft, t.editor.left], ["center", AlignCenter, t.editor.center], ["right", AlignRight, t.editor.right]] as const).map(([a, Icon, label]) => (
                      <button key={a} title={label} aria-pressed={selected.align === a} onClick={() => patch(selected.id, { align: a })} className={`rounded-md border-2 border-ink p-1.5 ${selected.align === a ? "bg-brand" : ""}`}><Icon className="h-4 w-4" /></button>
                    ))}
                  </div>
                </>
              )}

              {selected.kind === "image" && (
                <>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-ink/50 p-2 text-xs font-bold">
                    <ImagePlus className="h-4 w-4" /> {t.editor.uploadPhoto}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && uploadInto(e.target.files[0], (src) => patch(selected.id, { src }))} />
                  </label>
                  <p className="text-[11px] text-stone">{t.editor.photoRights}</p>
                  {galleryPhotos.length > 0 && (
                    <div>
                      <p className="mb-1 text-[11px] font-bold">{t.editor.fromGallery}</p>
                      <div className="flex flex-wrap gap-1">
                        {galleryPhotos.slice(0, 12).map((p) => (
                          <button key={p.id} type="button" title={pick(p.title, lang)} onClick={() => patch(selected.id, { src: p.image })} className={`overflow-hidden rounded-md border-2 ${selected.src === p.image ? "border-ink ring-2 ring-brand" : "border-ink/40"}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.image} alt={pick(p.alt, lang) || pick(p.title, lang)} className="h-12 w-12 object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-1 text-xs font-bold">
                    {(["cover", "contain"] as const).map((f) => (
                      <button key={f} onClick={() => patch(selected.id, { fit: f })} className={`rounded-md border-2 border-ink px-2 py-1.5 ${selected.fit === f ? "bg-brand" : ""}`}>{f === "cover" ? t.editor.fitCover : t.editor.fitContain}</button>
                    ))}
                  </div>
                  <Num label={t.editor.zoom} value={selected.zoom ?? 1} min={0.5} max={3} step={0.05} onChange={(n) => patch(selected.id, { zoom: n })} />
                  <Num label="Pan X" value={selected.panX ?? 0} min={-1} max={1} step={0.05} onChange={(n) => patch(selected.id, { panX: n })} />
                  <Num label="Pan Y" value={selected.panY ?? 0} min={-1} max={1} step={0.05} onChange={(n) => patch(selected.id, { panY: n })} />
                  <Num label={t.editor.radius} value={selected.radius ?? 0} min={0} max={600} onChange={(n) => patch(selected.id, { radius: n })} />
                  <Num label={t.editor.width} value={selected.width} min={40} max={POSTER_W} onChange={(n) => patch(selected.id, { width: n })} />
                  <Num label={t.editor.height} value={selected.height} min={40} max={POSTER_H} onChange={(n) => patch(selected.id, { height: n })} />
                </>
              )}

              {selected.kind === "logo" && <Num label={t.editor.size} value={selected.size} min={40} max={500} onChange={(n) => patch(selected.id, { size: n })} />}

              {selected.kind === "shape" && (
                <>
                  <div className="grid grid-cols-3 gap-1 text-xs font-bold">
                    {([["rect", t.editor.shapeRect], ["circle", t.editor.shapeCircle], ["band", t.editor.shapeBand]] as const).map(([s, label]) => (
                      <button key={s} onClick={() => patch(selected.id, { shape: s })} className={`rounded-md border-2 border-ink px-1 py-1.5 ${selected.shape === s ? "bg-brand" : ""}`}>{label}</button>
                    ))}
                  </div>
                  <label className="block text-xs font-bold">{t.editor.color}
                    <input type="color" value={selected.color} onChange={(e) => patch(selected.id, { color: e.target.value })} className="mt-1 block h-9 w-full cursor-pointer rounded border-2 border-ink" />
                  </label>
                  <Num label={t.editor.opacity} value={selected.opacity} min={0} max={1} step={0.05} onChange={(n) => patch(selected.id, { opacity: n })} />
                  <Num label={t.editor.rotation} value={selected.rotation ?? 0} min={-180} max={180} onChange={(n) => patch(selected.id, { rotation: n })} />
                  <Num label={t.editor.width} value={selected.width} min={20} max={2000} onChange={(n) => patch(selected.id, { width: n })} />
                  <Num label={t.editor.height} value={selected.height} min={20} max={2000} onChange={(n) => patch(selected.id, { height: n })} />
                </>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Num label={t.editor.x} value={selected.x} onChange={(n) => patch(selected.id, { x: n })} />
                <Num label={t.editor.y} value={selected.y} onChange={(n) => patch(selected.id, { y: n })} />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-xl border-2 border-ink bg-white p-4">
          <h3 className="font-display text-xl uppercase">{t.editor.saveToPosters}</h3>
          <input className={fieldCls} lang="en" placeholder={t.editor.posterTitleEn} value={titleBi.en} onChange={(e) => setTitleBi({ ...titleBi, en: e.target.value })} />
          <input className={fieldCls} lang="te" placeholder={t.editor.posterTitleTe} value={titleBi.te} onChange={(e) => setTitleBi({ ...titleBi, te: e.target.value })} />
          <select className={fieldCls} value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t.editor.category}>
            {categories.map((c) => <option key={c.id} value={c.id}>{pick(c.name, lang)}</option>)}
          </select>
          <button onClick={saveToPosters} disabled={busy !== ""} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-bold ring-2 ring-ink disabled:opacity-60">
            {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t.editor.saveToPosters}
          </button>
          <hr className="border-line" />
          <input className={fieldCls} lang="en" placeholder={`${t.editor.saveTemplate} (EN)`} value={templateName.en} onChange={(e) => setTemplateName({ ...templateName, en: e.target.value })} />
          <input className={fieldCls} lang="te" placeholder={`${t.editor.saveTemplate} (తె)`} value={templateName.te} onChange={(e) => setTemplateName({ ...templateName, te: e.target.value })} />
          <button onClick={saveTemplate} disabled={busy !== ""} className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink px-4 py-2 text-sm font-bold disabled:opacity-60">
            {busy === "template" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {t.editor.saveTemplate}
          </button>
        </section>
      </div>
    </div>
  );
}
