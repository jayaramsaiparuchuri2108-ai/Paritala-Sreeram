import { ImageResponse } from "next/og";

export const alt = "Paritala Sreeram — Telugu Desam Party, Dharmavaram";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share card (Latin text only - the bundled OG font has no Telugu glyphs).
export default async function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#F5D51C", padding: 72, color: "#171717" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, fontWeight: 700, letterSpacing: 4 }}>
          <div style={{ width: 64, height: 10, background: "#171717" }} /> TELUGU DESAM PARTY · DHARMAVARAM
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 168, fontWeight: 900, lineHeight: 0.95, textTransform: "uppercase" }}>
          <span>Paritala</span>
          <span>Sreeram</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 32, fontWeight: 600 }}>Public profile · Andhra Pradesh</div>
          <div style={{ display: "flex", background: "#171717", color: "#F5D51C", padding: "14px 28px", borderRadius: 999, fontSize: 28, fontWeight: 700 }}>
            Independent website
          </div>
        </div>
      </div>
    ),
    size,
  );
}
