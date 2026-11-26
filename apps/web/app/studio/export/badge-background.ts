import type { BorderStyle } from "../controls/border-controls";
import { buildPolygonPoints } from "../geometry";

export type BgStyle = "solid" | "gradient" | "transparent";
export type GradientStop = { id: string; color: string; pos: number };

type BadgeBackgroundOptions = {
  hasBackground: boolean;
  bgStyle: BgStyle;
  bgColor: string;
  bgStops: readonly GradientStop[];
  bgGradType: "linear" | "radial";
  bgGradAngle: number;
  boxSize: number;
  vertices: number;
  starDepth: number;
  cornerRadius: number;
  borderStyle: BorderStyle;
  borderColor: string;
  visibleBorderWidth: number;
};

/** Genera la geometría del fondo y sus definiciones SVG para el lienzo y las exportaciones. */
export function buildBadgeBackground({
  hasBackground,
  bgStyle,
  bgColor,
  bgStops,
  bgGradType,
  bgGradAngle,
  boxSize,
  vertices,
  starDepth,
  cornerRadius,
  borderStyle,
  borderColor,
  visibleBorderWidth,
}: BadgeBackgroundOptions) {
  if (!hasBackground) {
    return "";
  }

  const sortedBgStops = [...bgStops].sort((a, b) => a.pos - b.pos);
  const bgStopTags = sortedBgStops
    .map((s) => `<stop offset="${s.pos}%" stop-color="${s.color}" />`)
    .join("");
  const defsParts: string[] = [];

  if (bgStyle === "gradient") {
    if (bgGradType === "radial") {
      const half = Number((boxSize / 2).toFixed(2));
      defsParts.push(
        `<radialGradient id="unancha-bg-grad" gradientUnits="userSpaceOnUse" cx="${half}" cy="${half}" r="${half}">${bgStopTags}</radialGradient>`,
      );
    } else {
      const rad = ((bgGradAngle - 90) * Math.PI) / 180;
      const half = boxSize / 2;
      const x1 = (half - Math.cos(rad) * half).toFixed(1);
      const y1 = (half - Math.sin(rad) * half).toFixed(1);
      const x2 = (half + Math.cos(rad) * half).toFixed(1);
      const y2 = (half + Math.sin(rad) * half).toFixed(1);
      defsParts.push(
        `<linearGradient id="unancha-bg-grad" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${bgStopTags}</linearGradient>`,
      );
    }
  }

  const fill = bgStyle === "gradient" ? "url(#unancha-bg-grad)" : bgStyle === "transparent" ? "none" : bgColor;
  const inset = visibleBorderWidth / 2;
  let stroke = "";

  if (visibleBorderWidth > 0) {
    stroke = ` stroke="${borderColor}" stroke-width="${visibleBorderWidth}" stroke-linejoin="round"`;

    if (borderStyle === "dashed") {
      stroke += ` stroke-dasharray="${visibleBorderWidth * 3} ${visibleBorderWidth * 2}"`;
    } else if (borderStyle === "dotted") {
      stroke += ` stroke-dasharray="0 ${visibleBorderWidth * 2.4}" stroke-linecap="round"`;
    }
  }

  const defs = defsParts.length ? `<defs>${defsParts.join("")}</defs>` : "";

  if (vertices >= 3) {
    const points = buildPolygonPoints(vertices, boxSize, starDepth, Math.max(2, inset))
      .map(([x, y]) => `${x},${y}`)
      .join(" ");

    return `${defs}<polygon points="${points}" fill="${fill}"${stroke} />`;
  }

  const extent = boxSize - visibleBorderWidth;
  const radius = Math.max(0, boxSize * cornerRadius / 100 - inset);

  return `${defs}<rect x="${inset}" y="${inset}" width="${extent}" height="${extent}" rx="${radius}" fill="${fill}"${stroke} />`;
}
