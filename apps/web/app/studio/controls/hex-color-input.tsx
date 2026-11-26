import { useEffect, useState } from "react";

/** Edita el color hexadecimal y restaura el valor anterior si la entrada es inválida. */
export function HexColorInput({
  value,
  disabled,
  onChangeColor,
  label = "Código hexadecimal del color",
}: {
  value: string;
  disabled?: boolean;
  onChangeColor: (hex: string) => void;
  label?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  /** Normaliza los formatos de tres y seis dígitos antes de confirmar el color. */
  function commit(raw: string) {
    const clean = raw.trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{6}$/.test(clean)) {
      const next = `#${clean.toLowerCase()}`;
      setDraft(next);
      onChangeColor(next);

      return true;
    }

    if (/^[0-9a-fA-F]{3}$/.test(clean)) {
      const next = `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`.toLowerCase();
      setDraft(next);
      onChangeColor(next);

      return true;
    }

    return false;
  }

  return (
    <input
      type="text"
      className="studio-figma-hex-input"
      value={draft}
      disabled={disabled}
      maxLength={7}
      spellCheck={false}
      aria-label={label}
      onChange={(e) => {
        const next = e.currentTarget.value;
        setDraft(next);
        const clean = next.trim().replace(/^#/, "");
        if (/^[0-9a-fA-F]{6}$/.test(clean)) {
          onChangeColor(`#${clean.toLowerCase()}`);
        }
      }}
      onBlur={() => {
        if (!commit(draft)) {
          setDraft(value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          if (!commit(draft)) {
            setDraft(value);
          }

          e.currentTarget.blur();
        }
      }}
    />
  );
}
