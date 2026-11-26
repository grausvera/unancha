"use client";

import { useState } from "react";
import { Check, Copy } from "@grausvera/unancha/icons";
import { highlightCode } from "../lib/syntax-highlight";

type CodeBlockProps = {
  label: string;
  code: string;
  kind?: "file";
  language?: Parameters<typeof highlightCode>[1];
};

/** Muestra un ejemplo seleccionable y comunica el resultado de copiar al portapapeles. */
export function CodeBlock({ label, code, kind, language }: CodeBlockProps) {
  const [feedback, setFeedback] = useState<{ code: string; status: "copied" | "failed" }>();
  const status = feedback?.code === code ? feedback.status : "idle";

  /** Copia el texto exacto del ejemplo y ofrece una alternativa si falla el portapapeles. */
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setFeedback({ code, status: "copied" });
    } catch {
      setFeedback({ code, status: "failed" });
    }
  }

  return (
    <div className="docs-code" data-language={language}>
      <div className="docs-code-header">
        {kind === "file" ? <code className="docs-reference-file">{label}</code> : <span>{label}</span>}
        <button type="button" className="detail-copy-mini" onClick={copy} aria-label={`Copiar ejemplo de ${label}`}>
          {status === "copied" ? <Check /> : <Copy />}
          <span>{status === "copied" ? "Copiado" : "Copiar"}</span>
        </button>
      </div>
      <pre tabIndex={0} aria-label={`Código de ${label}`}><code>{highlightCode(code, language)}</code></pre>
      <span className="visually-hidden" role="status">{status === "copied" ? "Ejemplo copiado" : ""}</span>
      {status === "failed" && <p className="docs-copy-feedback" role="status">Selecciona el código para copiarlo manualmente.</p>}
    </div>
  );
}
