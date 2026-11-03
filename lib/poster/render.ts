import { POSTER_H, POSTER_W } from "@/data/poster-templates";
import type { PosterBackground, PosterLayer, TextLayer } from "@/types";

export interface PosterState {
  background: PosterBackground;
  layers: PosterLayer[];
}

export type ImageMap = Map<string, HTMLImageElement>;
export const LOGO_SRC = "/logos/tdp-logo.png";

export function fontString(l: Pick<TextLayer, "weight" | "size" | "font">): string {
  return `${l.weight} ${l.size}px "${l.font}", "Noto Sans Telugu", "Inter Variable", sans-serif`;
}

/** Splits a single over-long word on grapheme boundaries so Telugu conjuncts are never cut apart. */
function breakWord(ctx: CanvasRenderingContext2D, word: string, maxWidth: number): string[] {
  const seg = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const graphemes = seg ? Array.from(seg.segment(word), (s) => s.segment) : Array.from(word);
  const out: string[] = [];
  let line = "";
  for (const g of graphemes) {
    if (line && ctx.measureText(line + g).width > maxWidth) {
      out.push(line);
      line = g;
    } else line += g;
  }
  if (line) out.push(line);
  return out;
}

export function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
        continue;
      }
      if (line) lines.push(line);
      if (ctx.measureText(word).width > maxWidth) {
        const parts = breakWord(ctx, word, maxWidth);
        lines.push(...parts.slice(0, -1));
        line = parts[parts.length - 1] ?? "";
      } else line = word;
    }
    lines.push(line);
  }
  return lines;
}

function textLines(ctx: CanvasRenderingContext2D, l: TextLayer): string[] {
  ctx.font = fontString(l);
  return wrapLines(ctx, l.uppercase ? l.text.toUpperCase() : l.text, l.width);
}

export function layerBounds(ctx: CanvasRenderingContext2D, l: PosterLayer): { x: number; y: number; w: number; h: number } {
  switch (l.kind) {
    case "text": {
      const lines = textLines(ctx, l);
      return { x: l.x, y: l.y, w: l.width, h: Math.max(l.size * l.lineHeight, lines.length * l.size * l.lineHeight) };
    }
    case "image":
    case "shape":
      return { x: l.x, y: l.y, w: l.width, h: l.height };
    case "logo":
      return { x: l.x, y: l.y, w: l.size, h: l.size };
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, bg: PosterBackground, images: ImageMap) {
  if (bg.type === "gradient") {
    const a = ((bg.angle ?? 160) * Math.PI) / 180;
    const cx = POSTER_W / 2;
    const cy = POSTER_H / 2;
    const r = Math.hypot(POSTER_W, POSTER_H) / 2;
    const dx = Math.sin(a) * r;
    const dy = -Math.cos(a) * r;
    const g = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    g.addColorStop(0, bg.color);
    g.addColorStop(1, bg.color2 ?? bg.color);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, POSTER_W, POSTER_H);
    return;
  }
  ctx.fillStyle = bg.color;
  ctx.fillRect(0, 0, POSTER_W, POSTER_H);
  if (bg.type === "image" && bg.src) {
    const img = images.get(bg.src);
    if (img) {
      const s = Math.max(POSTER_W / img.width, POSTER_H / img.height);
      const w = img.width * s;
      const h = img.height * s;
      ctx.drawImage(img, (POSTER_W - w) / 2, (POSTER_H - h) / 2, w, h);
    }
  }
}

function drawLayer(ctx: CanvasRenderingContext2D, l: PosterLayer, images: ImageMap, preview: boolean) {
  ctx.save();
  switch (l.kind) {
    case "shape": {
      ctx.globalAlpha = l.opacity;
      ctx.fillStyle = l.color;
      const cx = l.x + l.width / 2;
      const cy = l.y + l.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(((l.rotation ?? 0) * Math.PI) / 180);
      if (l.shape === "circle") {
        ctx.beginPath();
        ctx.ellipse(0, 0, l.width / 2, l.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-l.width / 2, -l.height / 2, l.width, l.height);
      }
      break;
    }
    case "logo": {
      const img = images.get(LOGO_SRC);
      if (img) ctx.drawImage(img, l.x, l.y, l.size, l.size);
      break;
    }
    case "image": {
      const { x, y, width: w, height: h } = l;
      const img = l.src ? images.get(l.src) : undefined;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, Math.min(l.radius ?? 0, w / 2, h / 2));
      if (!img) {
        if (preview) {
          ctx.fillStyle = "rgba(23,23,23,0.06)";
          ctx.fill();
          ctx.setLineDash([14, 10]);
          ctx.lineWidth = 3;
          ctx.strokeStyle = "rgba(23,23,23,0.45)";
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(23,23,23,0.55)";
          ctx.font = '700 34px "Inter Variable", sans-serif';
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("+ photo", x + w / 2, y + h / 2);
        }
        break;
      }
      ctx.clip();
      const zoom = l.zoom ?? 1;
      const scale = (l.fit === "cover" ? Math.max(w / img.width, h / img.height) : Math.min(w / img.width, h / img.height)) * zoom;
      const dw = img.width * scale;
      const dh = img.height * scale;
      const px = (w - dw) / 2 * (1 + (l.panX ?? 0));
      const py = (h - dh) / 2 * (1 + (l.panY ?? 0));
      ctx.drawImage(img, x + px, y + py, dw, dh);
      break;
    }
    case "text": {
      const lines = textLines(ctx, l);
      ctx.fillStyle = l.color;
      ctx.textBaseline = "top";
      ctx.textAlign = l.align;
      const ax = l.align === "left" ? l.x : l.align === "center" ? l.x + l.width / 2 : l.x + l.width;
      const lineH = l.size * l.lineHeight;
      lines.forEach((line, i) => ctx.fillText(line, ax, l.y + i * lineH + (lineH - l.size) / 2));
      break;
    }
  }
  ctx.restore();
}

export function renderPoster(
  ctx: CanvasRenderingContext2D,
  state: PosterState,
  images: ImageMap,
  opts: { preview: boolean; selectedId?: string | null },
) {
  ctx.clearRect(0, 0, POSTER_W, POSTER_H);
  drawBackground(ctx, state.background, images);
  for (const layer of state.layers) drawLayer(ctx, layer, images, opts.preview);

  if (opts.preview && opts.selectedId) {
    const sel = state.layers.find((l) => l.id === opts.selectedId);
    if (sel) {
      const b = layerBounds(ctx, sel);
      ctx.save();
      ctx.strokeStyle = "#ff3d00";
      ctx.lineWidth = 4;
      ctx.setLineDash([16, 10]);
      ctx.strokeRect(b.x, b.y, b.w, b.h);
      ctx.setLineDash([]);
      ctx.fillStyle = "#ff3d00";
      for (const [cx, cy] of [[b.x, b.y], [b.x + b.w, b.y], [b.x, b.y + b.h], [b.x + b.w, b.y + b.h]]) {
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

/** Returns the id of the top-most layer under the point, or null. */
export function hitTest(ctx: CanvasRenderingContext2D, state: PosterState, x: number, y: number): string | null {
  for (let i = state.layers.length - 1; i >= 0; i--) {
    const l = state.layers[i];
    const b = layerBounds(ctx, l);
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return l.id;
  }
  return null;
}
