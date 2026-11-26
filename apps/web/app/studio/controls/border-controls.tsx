import type { ReactNode } from "react";
import { HexColorInput } from "./hex-color-input";

export type BorderStyle = "none" | "solid" | "dashed" | "dotted";
type BorderControlsProps = {
  hasBackground: boolean;
  borderStyle: BorderStyle;
  setBorderStyle: (style: BorderStyle) => void;
  borderWidth: number;
  maximumBorderWidth: number;
  setBorderWidth: (width: number) => void;
  borderColor: string;
  paletteOpen: boolean;
  onTogglePalette: () => void;
  onChangeColor: (hex: string) => void;
  palette: ReactNode;
};

/** Muestra los ajustes del borde y desactiva sus controles cuando el icono carece de fondo. */
export function BorderControls({
  hasBackground,
  borderStyle,
  setBorderStyle,
  borderWidth,
  maximumBorderWidth,
  setBorderWidth,
  borderColor,
  paletteOpen,
  onTogglePalette,
  onChangeColor,
  palette,
}: BorderControlsProps) {
  return (
    <section className="studio-inspector-section" data-disabled={!hasBackground || undefined} aria-labelledby="studio-border-heading">
      <div className="studio-section-head">
        <h2 id="studio-border-heading">Borde</h2>
      </div>
      <div className="studio-mini-tabs" role="group" aria-label="Estilo del borde">
        {([
          ["none", "Sin borde"],
          ["solid", "Continuo"],
          ["dashed", "Guiones"],
          ["dotted", "Puntos"],
        ] as const).map(([style, label]) => (
          <button
            key={style}
            type="button"
            disabled={!hasBackground}
            aria-pressed={borderStyle === style}
            onClick={() => setBorderStyle(style)}
          >
            {label}
          </button>
        ))}
      </div>
      {borderStyle !== "none" && (
        <>
          <label className="studio-prop-row">
            <span className="studio-prop-label">Grosor</span>
            <input
              type="range"
              min={1}
              max={maximumBorderWidth}
              value={Math.min(borderWidth, maximumBorderWidth)}
              disabled={!hasBackground}
              onChange={(event) => setBorderWidth(event.currentTarget.valueAsNumber)}
            />
            <output className="studio-prop-val">{Math.min(borderWidth, maximumBorderWidth)} px</output>
          </label>
          <div className="studio-fill-box">
            <div className="studio-figma-fill-row">
              <button
                type="button"
                className="studio-figma-color-chip"
                disabled={!hasBackground}
                aria-expanded={paletteOpen}
                data-active={paletteOpen || undefined}
                aria-label="Color del borde"
                title="Color del borde"
                onClick={onTogglePalette}
              >
                <span className="studio-figma-swatch-sq" style={{ background: borderColor }} aria-hidden="true" />
              </button>
              <HexColorInput
                label="Código hexadecimal del borde"
                value={borderColor}
                disabled={!hasBackground}
                onChangeColor={onChangeColor}
              />
            </div>
            {palette}
          </div>
        </>
      )}
    </section>
  );
}
