import type { CSSProperties } from "react";
import { defaultIconAppearance, iconMotionClass, svgDataUrl, type IconAppearance } from "../lib/icon-appearance";
import { prepareStandaloneSvg } from "../lib/svg-export";

type IconArtworkProps = {
  src: string;
  size?: number;
  label?: string;
  guides?: boolean;
  svgSource?: string;
  appearance?: IconAppearance;
  outline?: boolean;
};

/** Pinta el SVG exacto del catálogo con el color de la vista, sin modificar el archivo descargable. */
export function IconArtwork({ src, size, label, guides = false, svgSource, appearance, outline = false }: IconArtworkProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    opacity: appearance && appearance.opacity !== 100 ? appearance.opacity / 100 : undefined,
    rotate: appearance?.rotation ? `${appearance.rotation}deg` : undefined,
  };
  let maskSource = src;
  if (outline && svgSource && appearance?.strokeLinecap) {
    const drawing = prepareStandaloneSvg(svgSource, undefined, size, {
      outline,
      appearance: { ...defaultIconAppearance, strokeLinecap: appearance.strokeLinecap },
    });
    maskSource = svgDataUrl(drawing);
  }

  const artworkLabel = appearance?.label.trim() || label;
  const motion = appearance ? iconMotionClass(appearance) : undefined;
  return (
    <span className={motion ? `icon-artwork ${motion}` : "icon-artwork"} role={artworkLabel ? "img" : undefined}
      aria-label={artworkLabel} aria-hidden={artworkLabel ? undefined : true} style={style}>
      {guides && (
        <svg className="artwork-guides" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="20" height="20" rx="1" />
          <circle cx="12" cy="12" r="9" />
          <path d="M0 12h24M12 0v24M2 2l20 20M22 2 2 22" />
        </svg>
      )}
      <span className="artwork-mask" style={{ maskImage: `url("${maskSource}")` }} />
    </span>
  );
}
