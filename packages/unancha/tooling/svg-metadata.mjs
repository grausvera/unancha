import { createHash } from "node:crypto";

/** Lee la huella de los bytes originales y el viewBox de un SVG local de la colección. */
export function readSvgMetadata(bytes) {
  const svg = bytes.toString("utf8");
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const rootViewBox = svg.match(/<svg\b[^>]*\sviewBox="([^"]+)"/);

  return { svg, sha256, viewBox: rootViewBox?.[1] };
}

/** Agrupa los iconos por variante y conserva la revisión en el nombre del archivo. */
export function getIconAssetPath(id, variant, revision) {
  const key = id.slice("icons/".length);

  return `icons/${variant}/${key}.r${revision}.svg`;
}
