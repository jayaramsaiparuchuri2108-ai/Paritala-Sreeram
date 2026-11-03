import type { PosterTemplate } from "@/types";

export const POSTER_W = 1080;
export const POSTER_H = 1350;

export const YELLOW = "#F5D51C";
export const BLACK = "#171717";
export const WHITE = "#FFFFFF";
export const CREAM = "#FBF7E6";

export const POSTER_FONTS = [
  { id: "Anton", label: "Anton (English display)", sample: "Aa" },
  { id: "Playfair Display", label: "Playfair Display (English serif)", sample: "Aa" },
  { id: "Inter Variable", label: "Inter (English sans)", sample: "Aa" },
  { id: "Noto Sans Telugu", label: "Noto Sans Telugu", sample: "అఆ" },
  { id: "Noto Serif Telugu", label: "Noto Serif Telugu", sample: "అఆ" },
  { id: "Anek Telugu", label: "Anek Telugu", sample: "అఆ" },
  { id: "Ramabhadra", label: "Ramabhadra", sample: "అఆ" },
  { id: "Mandali", label: "Mandali", sample: "అఆ" },
] as const;

export const builtInTemplates: PosterTemplate[] = [
  {
    id: "tpl-classic-yellow",
    order: 1,
    published: true,
    name: { en: "Classic yellow", te: "క్లాసిక్ పసుపు" },
    background: { type: "solid", color: YELLOW },
    layers: [
      { id: "s1", kind: "shape", shape: "rect", x: 0, y: 930, width: 1080, height: 420, color: BLACK, opacity: 1 },
      { id: "i1", kind: "image", src: "", x: 150, y: 150, width: 780, height: 880, fit: "cover", radius: 0, zoom: 1 },
      { id: "t1", kind: "text", text: "Heading here", x: 60, y: 1010, width: 960, size: 108, font: "Anton", weight: 400, color: YELLOW, align: "left", lineHeight: 1.05, uppercase: true },
      { id: "t2", kind: "text", text: "ఇక్కడ వివరాలు రాయండి", x: 60, y: 1180, width: 820, size: 44, font: "Noto Sans Telugu", weight: 700, color: WHITE, align: "left", lineHeight: 1.3 },
      { id: "l1", kind: "logo", x: 900, y: 1170, size: 120 },
    ],
  },
  {
    id: "tpl-black-statement",
    order: 2,
    published: true,
    name: { en: "Black statement", te: "నలుపు సందేశం" },
    background: { type: "solid", color: BLACK },
    layers: [
      { id: "s1", kind: "shape", shape: "band", x: -200, y: 520, width: 1600, height: 190, color: YELLOW, opacity: 1, rotation: -10 },
      { id: "t1", kind: "text", text: "YOUR MESSAGE", x: 70, y: 120, width: 940, size: 150, font: "Anton", weight: 400, color: WHITE, align: "left", lineHeight: 1, uppercase: true },
      { id: "t2", kind: "text", text: "మీ సందేశం ఇక్కడ", x: 70, y: 880, width: 940, size: 76, font: "Noto Sans Telugu", weight: 800, color: YELLOW, align: "left", lineHeight: 1.25 },
      { id: "t3", kind: "text", text: "Paritala Sreeram", x: 70, y: 1230, width: 700, size: 50, font: "Playfair Display", weight: 700, color: WHITE, align: "left", lineHeight: 1.2 },
      { id: "l1", kind: "logo", x: 870, y: 1130, size: 150 },
    ],
  },
  {
    id: "tpl-festival",
    order: 3,
    published: true,
    name: { en: "Festival greeting", te: "పండుగ శుభాకాంక్షలు" },
    background: { type: "gradient", color: CREAM, color2: YELLOW, angle: 160 },
    layers: [
      { id: "s1", kind: "shape", shape: "circle", x: 190, y: 120, width: 700, height: 700, color: BLACK, opacity: 0.08 },
      { id: "i1", kind: "image", src: "", x: 290, y: 220, width: 500, height: 500, fit: "cover", radius: 250, zoom: 1 },
      { id: "t1", kind: "text", text: "శుభాకాంక్షలు", x: 60, y: 780, width: 960, size: 120, font: "Noto Serif Telugu", weight: 700, color: BLACK, align: "center", lineHeight: 1.2 },
      { id: "t2", kind: "text", text: "Festival greetings to everyone", x: 90, y: 960, width: 900, size: 54, font: "Playfair Display", weight: 700, color: BLACK, align: "center", lineHeight: 1.25 },
      { id: "t3", kind: "text", text: "Paritala Sreeram · పరిటాల శ్రీరామ్", x: 90, y: 1190, width: 900, size: 40, font: "Noto Sans Telugu", weight: 700, color: BLACK, align: "center", lineHeight: 1.3 },
      { id: "l1", kind: "logo", x: 480, y: 1250, size: 80 },
    ],
  },
  {
    id: "tpl-event",
    order: 4,
    published: true,
    name: { en: "Event invitation", te: "కార్యక్రమ ఆహ్వానం" },
    background: { type: "solid", color: WHITE },
    layers: [
      { id: "s1", kind: "shape", shape: "rect", x: 0, y: 0, width: 1080, height: 520, color: YELLOW, opacity: 1 },
      { id: "s2", kind: "shape", shape: "rect", x: 0, y: 1230, width: 1080, height: 120, color: BLACK, opacity: 1 },
      { id: "t1", kind: "text", text: "PUBLIC MEETING", x: 70, y: 90, width: 940, size: 130, font: "Anton", weight: 400, color: BLACK, align: "left", lineHeight: 1.02, uppercase: true },
      { id: "t2", kind: "text", text: "బహిరంగ సభ", x: 70, y: 380, width: 940, size: 80, font: "Noto Sans Telugu", weight: 800, color: BLACK, align: "left", lineHeight: 1.2 },
      { id: "t3", kind: "text", text: "Date · Time · Venue", x: 70, y: 620, width: 940, size: 60, font: "Inter Variable", weight: 700, color: BLACK, align: "left", lineHeight: 1.3 },
      { id: "t4", kind: "text", text: "తేదీ · సమయం · వేదిక", x: 70, y: 760, width: 940, size: 52, font: "Noto Sans Telugu", weight: 700, color: "#444444", align: "left", lineHeight: 1.3 },
      { id: "t5", kind: "text", text: "All are welcome", x: 70, y: 1260, width: 700, size: 44, font: "Playfair Display", weight: 700, color: YELLOW, align: "left", lineHeight: 1.2 },
      { id: "l1", kind: "logo", x: 850, y: 920, size: 170 },
    ],
  },
];
