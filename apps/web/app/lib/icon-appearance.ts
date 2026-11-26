export type IconAppearance = {
  strokeLinecap?: "butt" | "round" | "square";
  opacity: number;
  rotation: number;
  motion: "none" | "spin" | "pulse";
  label: string;
};

export const defaultIconAppearance: IconAppearance = { opacity: 100, rotation: 0, motion: "none", label: "" };

/** Traduce los controles en atributos SVG y aplica el trazo únicamente al contorno. */
export function iconAppearanceAttributes(appearance: IconAppearance, outline: boolean) {
  const attributes: Record<string, string | number> = {};
  const label = appearance.label.trim();

  if (outline && appearance.strokeLinecap) {
    attributes["stroke-linecap"] = appearance.strokeLinecap;
  }

  if (appearance.opacity !== 100) {
    attributes.opacity = appearance.opacity / 100;
  }

  if (label) {
    attributes.role = "img";
    attributes["aria-hidden"] = "false";
    attributes["aria-label"] = label;
  }

  return attributes;
}

/** Devuelve la clase de movimiento optativa usada por el icono y sus ejemplos. */
export function iconMotionClass(appearance: IconAppearance) {
  return appearance.motion === "none" ? undefined : `unancha-icon-${appearance.motion}`;
}

/** Prepara un recurso SVG para usarlo como imagen o máscara local. */
export function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg).replaceAll("'", "%27")}`;
}
