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
  ChevronDown,
  Copy,
  Download,
  ImagePlus,
  Save,
  Shapes,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { ApiError, useAdmin } from "@/components/admin/AdminProvider";
import { useAdminT } from "@/components/admin/i18n";
import { Button, IconButton, Segmented, cx, inputCls, useUi } from "@/components/admin/ui";
import { useLang } from "@/components/shared/Providers";
import { BLACK, builtInTemplates, POSTER_FONTS, POSTER_H, POSTER_W, YELLOW } from "@/data/poster-templates";
import { pick } from "@/lib/i18n";
import { hitTest, LOGO_SRC, renderPoster, type ImageMap, type PosterState } from "@/lib/poster/render";
import type { Bi, GalleryPhoto, PosterCategory, PosterLayer, PosterTemplate, ShapeLayer, TextLayer } from "@/types";

const uid = () => Math.random().toString(36).slice(2, 9);
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const fieldCls = cx(inputCls, "px-2.5 py-1.5");
const colorCls = "block h-9 w-full cursor-pointer border border-ink/30 bg-white p-0.5 hover:border-ink";

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
        <input type="number" step={step} value={Math.round(value * 100) / 100} onChange={(e) => onChange(Number(e.target.value))} className={cx(fieldCls, "w-20 shrink-0")} />
      </div>
    </label>
  );
}

/** Collapsible side-panel section. */
function Panel({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className="border border-ink/15 bg-white">
      <h3>
        <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left font-display text-lg hover:bg-brand/20">
          {title}
          <ChevronDown className={cx("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </h3>
      {open && (
        <div id={id} className="border-t border-ink/10 p-4">
          {children}
        </div>
      )}
    </section>
  );
}

const layerIcon = (l: PosterLayer): LucideIcon => (l.kind === "text" ? Type : l.kind === "image" ? ImagePlus : Shapes);

export function PosterEditor() {
  const { api } = useAdmin();
  const { lang, t } = useLang();
  const a = useAdminT();
  const { toast, confirm } = useUi();
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
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  // ------------------------------------------------------------ pointer + keyboard interaction
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
  function onCanvasKey(e: React.KeyboardEvent<HTMLCanvasElement>) {
    if (!selected) return;
    const step = e.shiftKey ? 10 : 1;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      patch(selected.id, { x: selected.x + moves[e.key][0], y: selected.y + moves[e.key][1] });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove(selected.id);
    }
  }

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
      const link = document.createElement("a");
      link.href = url;
      link.download = `paritala-sreeram-poster-${Date.now()}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function saveToPosters() {
    if (!titleBi.en.trim() && !titleBi.te.trim()) return toast.error(t.admin.required + ": " + t.editor.posterTitleEn);
    if (!category) return toast.error(t.admin.required + ": " + t.editor.category);
    setBusy("save");
    try {
      const blob = await renderToBlob();
      const form = new FormData();
      form.set("file", new File([blob], "poster.png", { type: "image/png" }));
      form.set("folder", "posters");
      const up = await api<{ url: string }>("/upload", { method: "POST", form });
      await api("/c/posters", { method: "POST", body: { title: titleBi, category, image: up.url, published: true, tags: [] } });
      toast.success(a.posterSavedPublished);
      setTitleBi({ en: "", te: "" });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function saveTemplate() {
    if (!templateName.en.trim() && !templateName.te.trim()) return toast.error(t.admin.required + ": " + a.templateName);
    setBusy("template");
    try {
      // Uploaded photos are never stored in templates - only the frames.
      const layers = state.layers.map((l) => (l.kind === "image" ? { ...l, src: "" } : l));
      const background = state.background.type === "image" ? { type: "solid" as const, color: state.background.color } : state.background;
      const res = await api<{ item: PosterTemplate }>("/c/posterTemplates", { method: "POST", body: { name: templateName, background, layers, published: true } });
      setCustomTemplates((c) => [...c, res.item]);
      setTemplateName({ en: "", te: "" });
      toast.success(a.templateSaved);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy("");
    }
  }

  async function deleteTemplate(tpl: PosterTemplate) {
    const ok = await confirm({ title: a.confirmTemplateDelete, message: pick(tpl.name, lang), confirmLabel: a.deleteAction, tone: "danger" });
    if (!ok) return;
    try {
      await api(`/c/posterTemplates/${tpl.id}`, { method: "DELETE" });
      setCustomTemplates((c) => c.filter((x) => x.id !== tpl.id));
      toast.success(a.toastDeleted);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t.admin.error);
    }
  }

  // ------------------------------------------------------------ UI pieces
  const layerName = (l: PosterLayer) =>
    l.kind === "text" ? l.text.slice(0, 26) || "Text" : l.kind === "image" ? `Photo${l.src ? "" : " (empty)"}` : l.kind === "logo" ? "TDP logo" : `Shape · ${l.shape}`;

  const addButtons: { label: string; icon: React.ReactNode; onClick: () => void }[] = [
    { label: t.editor.addText, icon: <Type className="h-4 w-4" aria-hidden />, onClick: addText },
    { label: t.editor.addImage, icon: <ImagePlus className="h-4 w-4" aria-hidden />, onClick: addImage },
    { label: t.editor.addLogo, icon: <Image src={LOGO_SRC} alt="" width={16} height={16} className="rounded-full" />, onClick: addLogo },
    { label: t.editor.addShape, icon: <Shapes className="h-4 w-4" aria-hidden />, onClick: () => addShape("band") },
  ];

  const templateList = (list: PosterTemplate[], deletable: boolean) => (
    <ul className="space-y-1.5">
      {list.map((tpl) => (
        <li key={tpl.id} className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setState(fromTemplate(tpl));
              setSelectedId(null);
            }}
            className="flex-1 border border-ink/25 bg-white px-3 py-2 text-left text-sm font-semibold transition-colors hover:border-ink hover:bg-brand"
          >
            {pick(tpl.name, lang)}
          </button>
          {deletable && (
            <IconButton label={t.admin.delete} tone="danger" onClick={() => deleteTemplate(tpl)}>
              <Trash2 className="h-4 w-4" aria-hidden />
            </IconButton>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[250px_minmax(0,1fr)_310px] 2xl:grid-cols-[280px_minmax(0,1fr)_340px]">
      {/* Left: templates, background, layers */}
      <div className="order-3 space-y-4 xl:order-1">
        <Panel title={t.editor.templates}>
          <p className="eyebrow mb-2 text-stone">{a.builtInTemplates}</p>
          {templateList(builtInTemplates, false)}
          {customTemplates.length > 0 && (
            <>
              <p className="eyebrow mb-2 mt-5 text-stone">{a.yourTemplates}</p>
              {templateList(customTemplates, true)}
            </>
          )}
        </Panel>

        <Panel title={t.editor.background}>
          <div className="space-y-3">
            <Segmented<"solid" | "gradient" | "image">
              label={t.editor.background}
              value={state.background.type}
              onChange={(type) => setState((s) => ({ ...s, background: { ...s.background, type } }))}
              options={[
                { value: "solid", label: t.editor.solid },
                { value: "gradient", label: t.editor.gradient },
                { value: "image", label: t.editor.image },
              ]}
            />
            <label className="block text-xs font-bold">
              {t.editor.color}
              <input type="color" value={state.background.color} onChange={(e) => setState((s) => ({ ...s, background: { ...s.background, color: e.target.value } }))} className={cx(colorCls, "mt-1")} />
            </label>
            {state.background.type === "gradient" && (
              <>
                <label className="block text-xs font-bold">
                  {t.editor.color2}
                  <input type="color" value={state.background.color2 ?? "#ffffff"} onChange={(e) => setState((s) => ({ ...s, background: { ...s.background, color2: e.target.value } }))} className={cx(colorCls, "mt-1")} />
                </label>
                <Num label="°" value={state.background.angle ?? 160} min={0} max={360} onChange={(n) => setState((s) => ({ ...s, background: { ...s.background, angle: n } }))} />
              </>
            )}
            {state.background.type === "image" && (
              <label className="flex cursor-pointer items-center gap-2 border border-dashed border-ink/50 p-2.5 text-xs font-bold hover:border-ink hover:bg-brand/30">
                <ImagePlus className="h-4 w-4" aria-hidden /> {t.editor.uploadPhoto}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && uploadInto(e.target.files[0], (src) => setState((s) => ({ ...s, background: { ...s.background, src } })))} />
              </label>
            )}
          </div>
        </Panel>

        <Panel title={t.editor.layers}>
          {state.layers.length === 0 ? (
            <p className="text-sm text-stone">{t.editor.selectLayer}</p>
          ) : (
            <ul className="space-y-1">
              {[...state.layers].reverse().map((l) => {
                const Icon = layerIcon(l);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(l.id)}
                      aria-pressed={l.id === selectedId}
                      className={cx("flex w-full items-center gap-2 border px-2.5 py-2 text-left text-xs font-semibold transition-colors", l.id === selectedId ? "border-ink bg-brand" : "border-transparent bg-cream hover:border-ink/40")}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{layerName(l)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      {/* Centre: stage */}
      <div className="order-1 min-w-0 xl:order-2">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border border-ink/15 bg-white p-2">
          <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label={a.designerTools}>
            {addButtons.map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={b.onClick}
                className="inline-flex items-center gap-2 border border-ink/25 bg-white px-3 py-2 text-[12px] font-bold transition-colors hover:border-ink hover:bg-brand"
              >
                {b.icon}
                <span className="hidden sm:inline">{b.label}</span>
                <span className="sm:hidden sr-only">{b.label}</span>
              </button>
            ))}
          </div>
          <Button variant="primary" loading={busy === "export"} icon={<Download className="h-4 w-4" aria-hidden />} disabled={busy !== ""} onClick={exportPng}>
            {busy === "export" ? t.editor.exporting : t.editor.exportPng}
          </Button>
        </div>

        <div className="relative flex items-center justify-center overflow-hidden border border-ink/15 bg-[radial-gradient(circle,rgba(8,8,8,0.12)_1px,transparent_1px)] bg-[length:18px_18px] bg-cream p-3 md:p-5">
          <canvas
            ref={canvasRef}
            width={POSTER_W}
            height={POSTER_H}
            tabIndex={0}
            className="block h-auto w-auto max-w-full cursor-move touch-none bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.55)] outline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink"
            style={{ aspectRatio: `${POSTER_W} / ${POSTER_H}`, maxHeight: "calc(100svh - 12rem)", minHeight: 280 }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onCanvasKey}
            role="img"
            aria-label={`${t.editor.preview} — ${a.designerHelp}`}
          />
        </div>
        <p className="mt-2 text-xs text-stone">
          {t.editor.preview} · {POSTER_W}×{POSTER_H} px — {a.exportHint}
        </p>
        <p className="mt-1 text-xs text-stone">{a.designerHelp}</p>
      </div>

      {/* Right: properties + save */}
      <div className="order-2 space-y-4 xl:order-3">
        <Panel title={a.designerProperties}>
          {!selected ? (
            <p className="text-sm text-stone">{t.editor.selectLayer}</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1" role="group" aria-label={layerName(selected)}>
                <IconButton label={t.editor.up} className="border-ink/25" onClick={() => move(selected.id, 1)}>
                  <ArrowUp className="h-4 w-4" aria-hidden />
                </IconButton>
                <IconButton label={t.editor.down} className="border-ink/25" onClick={() => move(selected.id, -1)}>
                  <ArrowDown className="h-4 w-4" aria-hidden />
                </IconButton>
                <IconButton label={t.editor.duplicate} className="border-ink/25" onClick={() => duplicate(selected.id)}>
                  <Copy className="h-4 w-4" aria-hidden />
                </IconButton>
                <IconButton label={t.editor.delete} tone="danger" className="border-red-700/40" onClick={() => remove(selected.id)}>
                  <Trash2 className="h-4 w-4" aria-hidden />
                </IconButton>
              </div>

              {selected.kind === "text" && (
                <>
                  <label className="block text-xs font-bold">
                    {t.editor.text}
                    <textarea value={selected.text} onChange={(e) => patch(selected.id, { text: e.target.value })} rows={3} className={cx(fieldCls, "mt-1")} />
                  </label>
                  <label className="block text-xs font-bold">
                    {t.editor.font}
                    <select value={selected.font} onChange={(e) => patch(selected.id, { font: e.target.value })} className={cx(fieldCls, "mt-1")}>
                      {POSTER_FONTS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs font-bold">
                      {t.editor.weight}
                      <select value={selected.weight} onChange={(e) => patch(selected.id, { weight: Number(e.target.value) })} className={cx(fieldCls, "mt-1")}>
                        {[400, 700, 800].map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-bold">
                      {t.editor.color}
                      <input type="color" value={selected.color} onChange={(e) => patch(selected.id, { color: e.target.value })} className={cx(colorCls, "mt-1 !h-[38px]")} />
                    </label>
                  </div>
                  <Num label={t.editor.size} value={selected.size} min={16} max={260} onChange={(n) => patch(selected.id, { size: n })} />
                  <Num label={t.editor.width} value={selected.width} min={80} max={POSTER_W} onChange={(n) => patch(selected.id, { width: n })} />
                  <Num label={t.editor.lineHeight} value={selected.lineHeight} min={0.9} max={2} step={0.05} onChange={(n) => patch(selected.id, { lineHeight: n })} />
                  <div className="flex gap-1" role="group" aria-label={t.editor.align}>
                    {([["left", AlignLeft, t.editor.left], ["center", AlignCenter, t.editor.center], ["right", AlignRight, t.editor.right]] as const).map(([al, Icon, label]) => (
                      <button key={al} type="button" title={label} aria-label={label} aria-pressed={selected.align === al} onClick={() => patch(selected.id, { align: al })} className={cx("grid h-9 w-9 place-items-center border border-ink/30 transition-colors hover:border-ink", selected.align === al && "border-ink bg-brand")}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {selected.kind === "image" && (
                <>
                  <label className="flex cursor-pointer items-center gap-2 border border-dashed border-ink/50 p-2.5 text-xs font-bold hover:border-ink hover:bg-brand/30">
                    <ImagePlus className="h-4 w-4" aria-hidden /> {t.editor.uploadPhoto}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && uploadInto(e.target.files[0], (src) => patch(selected.id, { src }))} />
                  </label>
                  <p className="text-[11px] leading-relaxed text-stone">{t.editor.photoRights}</p>
                  <div>
                    <p className="mb-1.5 text-xs font-bold">{a.galleryPhotoPick}</p>
                    {galleryPhotos.length === 0 ? (
                      <p className="border border-dashed border-ink/25 p-3 text-xs leading-relaxed text-stone">
                        {a.noGalleryPhotos}{" "}
                        <Link href="/admin/gallery" className="font-bold underline underline-offset-2">
                          {t.admin.gallery}
                        </Link>
                      </p>
                    ) : (
                      <ul className="grid max-h-56 grid-cols-4 gap-1.5 overflow-y-auto pr-1">
                        {galleryPhotos.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              title={pick(p.title, lang)}
                              aria-label={pick(p.title, lang)}
                              aria-pressed={selected.src === p.image}
                              onClick={() => patch(selected.id, { src: p.image })}
                              className={cx("relative block aspect-square w-full overflow-hidden border-2 transition-colors", selected.src === p.image ? "border-ink ring-2 ring-brand" : "border-transparent hover:border-ink/60")}
                            >
                              <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Segmented<"cover" | "contain"> label={t.editor.fitCover} value={selected.fit} onChange={(f) => patch(selected.id, { fit: f })} options={[{ value: "cover", label: t.editor.fitCover }, { value: "contain", label: t.editor.fitContain }]} />
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
                  <Segmented<ShapeLayer["shape"]>
                    label={t.editor.addShape}
                    value={selected.shape}
                    onChange={(s) => patch(selected.id, { shape: s })}
                    options={[
                      { value: "rect", label: t.editor.shapeRect },
                      { value: "circle", label: t.editor.shapeCircle },
                      { value: "band", label: t.editor.shapeBand },
                    ]}
                  />
                  <label className="block text-xs font-bold">
                    {t.editor.color}
                    <input type="color" value={selected.color} onChange={(e) => patch(selected.id, { color: e.target.value })} className={cx(colorCls, "mt-1")} />
                  </label>
                  <Num label={t.editor.opacity} value={selected.opacity} min={0} max={1} step={0.05} onChange={(n) => patch(selected.id, { opacity: n })} />
                  <Num label={t.editor.rotation} value={selected.rotation ?? 0} min={-180} max={180} onChange={(n) => patch(selected.id, { rotation: n })} />
                  <Num label={t.editor.width} value={selected.width} min={20} max={2000} onChange={(n) => patch(selected.id, { width: n })} />
                  <Num label={t.editor.height} value={selected.height} min={20} max={2000} onChange={(n) => patch(selected.id, { height: n })} />
                </>
              )}

              <div className="grid grid-cols-2 gap-3 border-t border-ink/10 pt-4">
                <Num label={t.editor.x} value={selected.x} onChange={(n) => patch(selected.id, { x: n })} />
                <Num label={t.editor.y} value={selected.y} onChange={(n) => patch(selected.id, { y: n })} />
              </div>
            </div>
          )}
        </Panel>

        <Panel title={t.editor.saveToPosters}>
          <div className="space-y-3">
            <input className={fieldCls} lang="en" aria-label={t.editor.posterTitleEn} placeholder={t.editor.posterTitleEn} value={titleBi.en} onChange={(e) => setTitleBi({ ...titleBi, en: e.target.value })} />
            <input className={fieldCls} lang="te" aria-label={t.editor.posterTitleTe} placeholder={t.editor.posterTitleTe} value={titleBi.te} onChange={(e) => setTitleBi({ ...titleBi, te: e.target.value })} />
            <select className={fieldCls} value={category} onChange={(e) => setCategory(e.target.value)} aria-label={t.editor.category}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {pick(c.name, lang)}
                </option>
              ))}
            </select>
            <Button variant="yellow" className="w-full" loading={busy === "save"} disabled={busy !== ""} icon={<Save className="h-4 w-4" aria-hidden />} onClick={saveToPosters}>
              {t.editor.saveToPosters}
            </Button>
          </div>
        </Panel>

        <Panel title={t.editor.saveTemplate} defaultOpen={false}>
          <div className="space-y-3">
            <input className={fieldCls} lang="en" aria-label={`${a.templateName} (EN)`} placeholder={`${a.templateName} (EN)`} value={templateName.en} onChange={(e) => setTemplateName({ ...templateName, en: e.target.value })} />
            <input className={fieldCls} lang="te" aria-label={`${a.templateName} (తె)`} placeholder={`${a.templateName} (తె)`} value={templateName.te} onChange={(e) => setTemplateName({ ...templateName, te: e.target.value })} />
            <Button variant="secondary" className="w-full" loading={busy === "template"} disabled={busy !== ""} icon={<Save className="h-4 w-4" aria-hidden />} onClick={saveTemplate}>
              {t.editor.saveTemplate}
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
