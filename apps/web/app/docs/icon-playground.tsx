"use client";

import { useId, useState } from "react";
import { Sun } from "@grausvera/unancha/icons";
import { buildFrameworkSnippet } from "../lib/framework-code";
import { defaultIconAppearance } from "../lib/icon-appearance";
import { CodeBlock } from "./code-block";
import { FrameworkPicker } from "./framework-picker";
import { docsFrameworks, type DocsFramework } from "./frameworks";

type Variant = "line" | "filled";

const variants: { id: Variant; label: string }[] = [
  { id: "line", label: "Contorno" },
  { id: "filled", label: "Sólido" },
];

/** Actualiza el ejemplo del Sol y genera el mismo código de integración que el Explorador. */
export function IconPlayground() {
  const sizeId = useId();
  const [variant, setVariant] = useState<Variant>("line");
  const [size, setSize] = useState(32);
  const [color, setColor] = useState("#a78bfa");
  const [framework, setFramework] = useState<DocsFramework>(docsFrameworks[0]);
  const tab = "snippet" in framework ? framework.snippet : framework.id;
  const code = buildFrameworkSnippet({
    tab,
    componentName: "Sun",
    src: "",
    label: "Sol",
    size,
    color,
    svgSource: "",
    variant,
    appearance: defaultIconAppearance,
    outline: variant === "line",
  });

  return (
    <div className="docs-playground">
      <div className="docs-playground-editor">
        <div className="docs-playground-preview">
          <Sun variant={variant} width={size} height={size} color={color} />
        </div>
        <div className="docs-playground-controls">
          <div className="explorer-segmented" role="group" aria-label="Variante del icono">
            {variants.map(({ id, label }) => (
              <button key={id} type="button" aria-pressed={variant === id} onClick={() => setVariant(id)}>
                {label}
              </button>
            ))}
          </div>
          <div className="docs-playground-size">
            <label htmlFor={sizeId}>Tamaño</label>
            <output aria-hidden="true">{size} px</output>
            <input
              id={sizeId}
              type="range"
              min={16}
              max={96}
              value={size}
              aria-valuetext={`${size} px`}
              onChange={(event) => setSize(event.currentTarget.valueAsNumber)}
            />
          </div>
          <label className="docs-playground-color">
            <span>Color</span>
            <input type="color" value={color} onChange={(event) => setColor(event.currentTarget.value)} />
            <code>{color}</code>
          </label>
        </div>
      </div>

      <div className="docs-playground-result">
        <FrameworkPicker options={docsFrameworks} selected={framework} onChoose={setFramework} />
        <CodeBlock label={framework.label} code={code} />
      </div>
    </div>
  );
}
