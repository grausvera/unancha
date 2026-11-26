import { Check, Copy, Download } from "@grausvera/unancha/icons";

type ExportAction = "copy" | "download";
type ExportActionsProps = {
  copiedKey: string;
  batchMode: boolean;
  batchCount: number;
  onSvg: (action: ExportAction) => Promise<void>;
  onPng: (action: ExportAction) => Promise<void>;
  onZip: () => Promise<void>;
  onToggleBatch: () => void;
};

/** Presenta las acciones de descarga y confirma qué formato se copió. */
export function ExportActions({ copiedKey, batchMode, batchCount, onSvg, onPng, onZip, onToggleBatch }: ExportActionsProps) {
  return (
    <section className="studio-inspector-footer" aria-label="Acciones de exportación">
      <div className="studio-export-row">
        <button
          type="button"
          className="primary-action"
          onClick={() => void onSvg("copy")}
        >
          {copiedKey === "badge-svg" ? <Check /> : <Copy />}
          <span>
            {copiedKey === "badge-svg" ? "SVG copiado" : "Copiar SVG"}
          </span>
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => void onPng("copy")}
        >
          {copiedKey === "badge-png" ? <Check /> : <Copy />}
          <span>
            {copiedKey === "badge-png" ? "PNG copiado" : "Copiar PNG"}
          </span>
        </button>
      </div>

      <div
        className="studio-export-row"
        style={{ borderTop: 0, paddingTop: 0 }}
      >
        <button
          type="button"
          className="secondary-action"
          onClick={() => void onSvg("download")}
        >
          <Download />
          <span>Descargar SVG</span>
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => void onPng("download")}
        >
          <Download />
          <span>Descargar PNG</span>
        </button>
      </div>

      <div
        className="studio-export-row"
        style={{ borderTop: 0, paddingTop: 0 }}
      >
        <button
          type="button"
          className="secondary-action"
          aria-pressed={batchMode}
          onClick={onToggleBatch}
          style={{
            gridColumn:
              batchMode && batchCount > 0 ? undefined : "1 / -1",
          }}
        >
          <span>{batchMode ? "Cancelar" : "Exportar paquete"}</span>
        </button>
        {batchMode && batchCount > 0 && (
          <button
            type="button"
            className="primary-action"
            onClick={() => void onZip()}
          >
            <Download />
            <span>ZIP ({batchCount})</span>
          </button>
        )}
      </div>
    </section>
  );
}
