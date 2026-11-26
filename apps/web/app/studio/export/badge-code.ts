import type { CodeFormat } from "../canvas";
import type { StudioDrawing, StudioIcon } from "../catalogue";
import type { GradientStop } from "./badge-background";
import { buildBadgeComponent } from "./component-code";

type BadgeAppearance = {
  backgroundMarkup: string;
  boxSize: number;
  fittedIconSize: number;
  iconColor: string;
  iconGradient: boolean;
  iconStops: readonly GradientStop[];
};
type BadgeCodeOptions = {
  format: CodeFormat;
  activeDrawing?: StudioDrawing;
  activeIcon?: StudioIcon;
  rawSvg: string;
  batchMode: boolean;
  batchIds: readonly string[];
  icons: readonly StudioIcon[];
  backgroundImage: string;
  appearance: BadgeAppearance;
};

/** Convierte el identificador y la variante en el nombre del componente exportado. */
function getBadgeComponentName({ assetId, variant }: StudioDrawing): string {
  const slug = assetId.replace(/^icons\//, "");
  const name = slug
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ""))
    .join("");

  return variant === "filled" ? `${name}FilledBadge` : `${name}Badge`;
}

/** Compone el SVG exportable con el fondo y el tamaño que usa la vista previa. */
export function composeBadgeSvg(rawSvg: string, appearance: BadgeAppearance): string {
  const { backgroundMarkup, boxSize, fittedIconSize, iconColor, iconGradient, iconStops } = appearance;
  const iconFill = iconGradient ? "url(#unancha-icon-grad)" : iconColor;
  const innerMatch = rawSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  const inner = innerMatch ? innerMatch[1].replace(/currentColor/gi, iconFill).trim() : "";
  const offset = Number(((boxSize - fittedIconSize) / 2).toFixed(2));
  const scale = Number((fittedIconSize / 24).toFixed(4));
  let iconDefs = "";

  if (iconGradient) {
    const tags = [...iconStops]
      .sort((a, b) => a.pos - b.pos)
      .map((stop) => `<stop offset="${stop.pos}%" stop-color="${stop.color}" />`)
      .join("");
    iconDefs = `<defs><linearGradient id="unancha-icon-grad" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="24" y2="24">${tags}</linearGradient></defs>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${boxSize}" height="${boxSize}" viewBox="0 0 ${boxSize} ${boxSize}" fill="none">\n${iconDefs}${backgroundMarkup}\n  <g transform="translate(${offset} ${offset}) scale(${scale})" fill="none" stroke="${iconFill}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">\n    ${inner}\n  </g>\n</svg>`;
}

/** Genera el ejemplo de integración que corresponde al formato y a la selección del lienzo. */
export function buildBadgeCodeSnippet(options: BadgeCodeOptions): string {
  const { format, activeDrawing, activeIcon, rawSvg, batchMode, batchIds, icons, backgroundImage, appearance } = options;
  const { backgroundMarkup, boxSize, fittedIconSize, iconColor, iconGradient, iconStops } = appearance;

  if (format === "react" || format === "vue" || format === "svelte") {
    if (!activeDrawing) {
      return "";
    }

    return buildBadgeComponent({
      format,
      name: getBadgeComponentName(activeDrawing),
      asset: activeDrawing.packageAsset,
      reactModule: activeDrawing.reactModule,
      background: backgroundMarkup,
      size: boxSize,
      iconSize: fittedIconSize,
      iconColor,
      iconStops: iconGradient ? [...iconStops].sort((a, b) => a.pos - b.pos) : [],
    });
  }

  const hasBatchItems = batchMode && batchIds.length > 0;
  const activeIds = activeIcon ? [activeIcon.assetId] : [];
  const targetIds = hasBatchItems ? batchIds : activeIds;

  if (format === "css") {
    return targetIds
      .map((id) => {
        const slug = id.replace(/^icons\//, "");

        return `.badge-${slug} {\n  width: ${boxSize}px;\n  height: ${boxSize}px;\n  display: grid;\n  place-items: center;\n  color: ${iconColor};\n  background: ${backgroundImage} center / contain no-repeat;\n}`;
      })
      .join("\n\n");
  }

  if (format === "tailwind") {
    return targetIds
      .map((id) => {
        const item = icons.find((icon) => icon.assetId === id);
        const slug = id.replace(/^icons\//, "");

        return `<div className="grid place-items-center w-[${boxSize}px] h-[${boxSize}px] text-[${iconColor}]" style={{ background: '${backgroundImage} center / contain no-repeat' }}>\n  {/* ${item?.label ?? slug} (${fittedIconSize}px) */}\n</div>`;
      })
      .join("\n\n");
  }

  const svg = composeBadgeSvg(rawSvg, appearance);
  if (hasBatchItems) {
    const svgWithoutFirstComment = svg.replace(/<!--[\s\S]*?-->/, "");

    return targetIds
      .map((id) => {
        const slug = id.replace(/^icons\//, "");

        return `<!-- ${slug} (${boxSize}×${boxSize}px) -->\n${svgWithoutFirstComment}`;
      })
      .join("\n\n");
  }

  return svg;
}
