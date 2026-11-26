import { useState } from "react";

type SizeControlProps = {
  label: string;
  accessibleLabel: string;
  value: number;
  min: number;
  max: number;
  actualSize?: number;
  onChange: (value: number) => void;
};

/** Sincroniza el deslizador con un campo de píxeles que se confirma con Enter o al salir. */
export function SizeControl({ label, accessibleLabel, value, min, max, actualSize = value, onChange }: SizeControlProps) {
  const [draft, setDraft] = useState<string | null>(null);

  /** Aplica el entero válido más cercano y recupera el valor anterior si el campo quedó vacío. */
  function commitSize(raw: string) {
    const size = Number(raw);
    if (draft !== null && raw.trim() && Number.isFinite(size)) {
      onChange(Math.min(max, Math.max(min, Math.round(size))));
    }

    setDraft(null);
  }

  return (
    <div className="studio-prop-row studio-size-control">
      <span className="studio-prop-label">{label}</span>
      <label className="studio-size-value">
        <input
          type="number"
          min={min}
          max={max}
          step={1}
          inputMode="numeric"
          aria-label={`${accessibleLabel} en píxeles`}
          value={draft ?? actualSize}
          onChange={(event) => setDraft(event.currentTarget.value)}
          onBlur={(event) => commitSize(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              setDraft(null);
            }
          }}
        />
        <span aria-hidden="true">px</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        value={actualSize}
        aria-label={accessibleLabel}
        aria-valuetext={actualSize === value ? `${value} px` : `${value} px solicitados, ajustado a ${actualSize} px`}
        onChange={(event) => {
          setDraft(null);
          onChange(event.currentTarget.valueAsNumber);
        }}
      />
    </div>
  );
}
