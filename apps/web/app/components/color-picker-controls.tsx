import type { CSSProperties, PointerEvent } from "react";
import { hsvToHex, type HsvColor } from "../lib/color";

type ColorPickerControlsProps = {
  hsv: HsvColor;
  onChange: (next: HsvColor, hex: string) => void;
  hueLabel?: string;
  hueMax?: number;
  compact?: boolean;
};

/** Comparte el plano de saturación y brillo y el deslizador de matiz entre los selectores de color. */
export function ColorPickerControls({
  hsv,
  onChange,
  hueLabel = "Matiz",
  hueMax = 359,
  compact = false,
}: ColorPickerControlsProps) {
  const [hue, saturation, value] = hsv;

  /** Mantiene el color dentro del rango incluso cuando el puntero sale del plano durante el arrastre. */
  function updatePlane(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const nextSaturation = Math.max(0, Math.min(100, Math.round((event.clientX - rect.left) / rect.width * 100)));
    const nextValue = Math.max(0, Math.min(100, Math.round((1 - (event.clientY - rect.top) / rect.height) * 100)));
    onChange([hue, nextSaturation, nextValue], hsvToHex(hue, nextSaturation, nextValue));
  }

  const slider = (
    <input
      type="range"
      min={0}
      max={hueMax}
      value={hue}
      aria-label={hueLabel}
      className="explorer-hue-slider"
      onChange={(event) => {
        const nextHue = event.currentTarget.valueAsNumber;
        onChange([nextHue, saturation, value], hsvToHex(nextHue, saturation, value));
      }}
    />
  );

  return (
    <>
      <div
        className="explorer-sv-plane"
        style={{ "--hue-color": `hsl(${hue} 100% 50%)` } as CSSProperties}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          updatePlane(event);
        }}
        onPointerMove={(event) => {
          if (event.buttons === 1) {
            updatePlane(event);
          }
        }}
      >
        <span
          className="explorer-sv-cursor"
          style={{ left: `${saturation}%`, top: `${100 - value}%` }}
          aria-hidden="true"
        />
      </div>
      {compact ? slider : <div className="explorer-hue-row">{slider}</div>}
    </>
  );
}
