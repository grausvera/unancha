import { defaultIconAppearance, type IconAppearance } from "../lib/icon-appearance";

type IconAppearanceControlsProps = {
  appearance: IconAppearance;
  outline: boolean;
  onChange: (appearance: IconAppearance) => void;
};

/** Presenta el mismo editor de atributos en la ficha y el inspector del Explorador. */
export function IconAppearanceControls({ appearance, outline, onChange }: IconAppearanceControlsProps) {
  return (
    <details className="icon-appearance">
      <summary>Apariencia y accesibilidad</summary>
      <div className="icon-appearance-fields">
        {outline && (
          <label>
            <span>Terminación del trazo</span>
            <select value={appearance.strokeLinecap ?? ""} onChange={(event) => {
              const value = event.currentTarget.value as IconAppearance["strokeLinecap"];
              onChange({ ...appearance, strokeLinecap: value || undefined });
            }}>
              <option value="">Original</option>
              <option value="round">Redonda</option>
              <option value="butt">Plana</option>
              <option value="square">Cuadrada</option>
            </select>
          </label>
        )}
        <label className="explorer-range-row">
          <span className="explorer-range-head">
            <span>Opacidad</span>
            <output>{appearance.opacity}%</output>
          </span>
          <input type="range" min={0} max={100} value={appearance.opacity}
            onChange={(event) => onChange({ ...appearance, opacity: event.currentTarget.valueAsNumber })} />
        </label>
        <label className="explorer-range-row">
          <span className="explorer-range-head">
            <span>Rotación</span>
            <output>{appearance.rotation}°</output>
          </span>
          <input type="range" min={-180} max={180} value={appearance.rotation}
            onChange={(event) => onChange({ ...appearance, rotation: event.currentTarget.valueAsNumber })} />
        </label>
        <label>
          <span>Animación</span>
          <select value={appearance.motion} onChange={(event) => {
            onChange({ ...appearance, motion: event.currentTarget.value as IconAppearance["motion"] });
          }}>
            <option value="none">Sin animación</option>
            <option value="spin">Giro</option>
            <option value="pulse">Pulso</option>
          </select>
        </label>
        <label>
          <span>Nombre accesible</span>
          <input type="text" placeholder="Decorativo" value={appearance.label} maxLength={100}
            onChange={(event) => onChange({ ...appearance, label: event.currentTarget.value })} />
        </label>
        {appearance !== defaultIconAppearance && (
          <button type="button" className="explorer-reset-btn" onClick={() => onChange(defaultIconAppearance)}>
            Restablecer apariencia
          </button>
        )}
      </div>
    </details>
  );
}
