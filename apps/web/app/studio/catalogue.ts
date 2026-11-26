import { normalizeSearch } from "../lib/normalize-search";

export type StudioDrawing = {
  assetId: string;
  variant: string;
  revision: number;
  label: string;
  url: string;
  packageAsset: string;
  reactModule?: string;
};
export type StudioVariant = "line" | "filled";
export type StudioIcon = {
  assetId: string;
  label: string;
  line?: StudioDrawing;
  filled?: StudioDrawing;
};

const pickerLimit = 72;

/** Agrupa las variantes por icono y conserva la revisión más reciente de cada una. */
export function getStudioIcons(catalogue: readonly StudioDrawing[]): StudioIcon[] {
  const icons = new Map<string, StudioIcon>();

  for (const drawing of catalogue) {
    const icon: StudioIcon = icons.get(drawing.assetId) ?? {
      assetId: drawing.assetId,
      label: drawing.label,
    };
    const variant = drawing.variant === "filled" ? "filled" : "line";
    const current = icon[variant];

    if (!current || drawing.revision > current.revision) {
      icon[variant] = drawing;
    }

    icons.set(drawing.assetId, icon);
  }

  return Array.from(icons.values());
}

/** Limita los resultados del selector y busca por etiqueta o identificador. */
export function filterStudioIcons(icons: readonly StudioIcon[], query: string): StudioIcon[] {
  const search = normalizeSearch(query);
  if (!search) {
    return icons.slice(0, pickerLimit);
  }

  return icons
    .filter((icon) => normalizeSearch(`${icon.label} ${icon.assetId}`).includes(search))
    .slice(0, pickerLimit);
}

/** Resuelve la variante para el lienzo, el lote y su descarga con el mismo respaldo. */
export function getStudioDrawing(icon: StudioIcon | undefined, variant: StudioVariant): StudioDrawing | undefined {
  if (variant === "filled" && icon?.filled) {
    return icon.filled;
  }

  return icon?.line ?? icon?.filled;
}
