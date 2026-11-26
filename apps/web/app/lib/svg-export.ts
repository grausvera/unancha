import { iconAppearanceAttributes, iconMotionClass, type IconAppearance } from "./icon-appearance";

type SvgExportOptions = { appearance: IconAppearance; outline: boolean; staticImage?: boolean };

/** Escapa un valor para insertarlo entre comillas dobles en un atributo XML. */
function escapeAttribute(value: string | number): string {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

/** Prepara un SVG autónomo con dimensiones explícitas y el color seleccionado en lugar de currentColor. */
export function prepareStandaloneSvg(rawSvg: string, color?: string, size?: number, options?: SvgExportOptions): string {
  let output = rawSvg.trim();
  if (!output) {
    return "";
  }

  if (color) {
    output = output.replace(/currentColor/gi, color);
  }

  const px = size && size > 0 ? Math.round(size) : 24;
  const attributes: Record<string, string | number> = { width: px, height: px };
  let motionStyle = "";

  if (options) {
    const { appearance, outline, staticImage } = options;
    Object.assign(attributes, iconAppearanceAttributes(appearance, outline));
    if (appearance.rotation) {
      attributes.style = `rotate: ${appearance.rotation}deg; transform-origin: center`;
    }

    const motionClass = staticImage ? undefined : iconMotionClass(appearance);
    if (motionClass) {
      const frames = appearance.motion === "spin" ? "to{transform:rotate(1turn)}" : "50%{transform:scale(.8)}";
      const timing = appearance.motion === "spin" ? "linear" : "ease-in-out";
      attributes.class = motionClass;
      motionStyle = `<style>.${motionClass}{transform-origin:center;animation:${motionClass} 1.5s ${timing} infinite}@keyframes ${motionClass}{${frames}}@media (prefers-reduced-motion:reduce){.${motionClass}{animation:none}}</style>`;
    }
  }

  output = output.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
    const cleaned = attrs.replace(/\s+([\w:-]+)=(?:"[^"]*"|'[^']*')/g, (attribute, name: string) =>
      Object.hasOwn(attributes, name) ? "" : attribute,
    );
    const serialized = Object.entries(attributes).map(([name, value]) => `${name}="${escapeAttribute(value)}"`).join(" ");

    return `<svg ${serialized}${cleaned}>${motionStyle}`;
  });

  return output;
}

/** Dispara la descarga de un Blob en el navegador sin revocar la URL antes de que termine de leerse. */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Obtiene un archivo SVG y le aplica el color y tamaño seleccionados. */
export async function fetchAndPrepareSvg(src: string, color?: string, size?: number, options?: SvgExportOptions): Promise<string> {
  const response = await fetch(src);
  if (!response.ok) {
    return "";
  }

  const raw = await response.text();

  return prepareStandaloneSvg(raw, color, size, options);
}

/** Descarga un archivo SVG aplicando el color y tamaño elegidos por el usuario. */
export async function downloadColoredSvg(
  src: string,
  filename: string,
  color?: string,
  size?: number,
  options?: SvgExportOptions,
): Promise<boolean> {
  const prepared = await fetchAndPrepareSvg(src, color, size, options);
  if (!prepared) {
    return false;
  }

  const blob = new Blob([prepared], { type: "image/svg+xml;charset=utf-8" });
  triggerBlobDownload(blob, filename);

  return true;
}

/** Renderiza una cadena SVG completa a un Blob PNG del tamaño indicado. */
export async function renderSvgStringToPngBlob(svgMarkup: string, exportSize: number): Promise<Blob | null> {
  if (!svgMarkup) {
    return null;
  }

  const svgBlob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });

    const canvas = document.createElement("canvas");
    canvas.width = exportSize;
    canvas.height = exportSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    ctx.drawImage(img, 0, 0, exportSize, exportSize);

    return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Renderiza un archivo SVG a un Blob PNG aplicando el color y tamaño seleccionados. */
export async function renderSvgToPngBlob(src: string, color: string, size: number, options?: SvgExportOptions): Promise<Blob | null> {
  const exportSize = Math.max(size, 128);
  const prepared = await fetchAndPrepareSvg(src, color, exportSize, options && { ...options, staticImage: true });
  if (!prepared) {
    return null;
  }

  return renderSvgStringToPngBlob(prepared, exportSize);
}
