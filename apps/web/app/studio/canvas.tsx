import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Check, Code, Copy, Eye, Minus, Plus } from "@grausvera/unancha/icons";
import { IconArtwork } from "../components/icon-artwork";
import { highlightCode } from "../lib/syntax-highlight";
import { navigateTabs } from "../lib/tab-keyboard";

const previewZoomLevels = [25, 50, 75, 100, 150, 200, 300, 400, 600, 800, 1200, 1600];
const actualSizeZoomIndex = previewZoomLevels.indexOf(100);

export type CanvasView = "preview" | "code";
const codeFormats = [
  ["svg", "SVG"],
  ["css", "CSS"],
  ["tailwind", "Tailwind"],
  ["react", "React"],
  ["vue", "Vue"],
  ["svelte", "Svelte"],
] as const;
export type CodeFormat = (typeof codeFormats)[number][0];

type StudioCanvasProps = {
  stageRef: RefObject<HTMLElement | null>;
  canvasView: CanvasView;
  setCanvasView: (view: CanvasView) => void;
  codeFormat: CodeFormat;
  setCodeFormat: (format: CodeFormat) => void;
  batchMode: boolean;
  batchItems: { id: string; label: string; url: string }[];
  boxSize: number;
  fittedIconSize: number;
  stagePreviewStyle: CSSProperties;
  iconGradient: boolean;
  activeDrawing?: { url: string };
  activeLabel?: string;
  badgeCodeSnippet: string;
  componentFormat: boolean;
  drawingLoaded: boolean;
  onCopyCode: () => void;
  copiedCode: boolean;
};

/** Presenta la vista previa, controla su zoom y muestra el código generado por Studio. */
export function StudioCanvas({
  stageRef,
  canvasView,
  setCanvasView,
  codeFormat,
  setCodeFormat,
  batchMode,
  batchItems,
  boxSize,
  fittedIconSize,
  stagePreviewStyle,
  iconGradient,
  activeDrawing,
  activeLabel,
  badgeCodeSnippet,
  componentFormat,
  drawingLoaded,
  onCopyCode,
  copiedCode,
}: StudioCanvasProps) {
  const [previewZoomIndex, setPreviewZoomIndex] = useState(actualSizeZoomIndex);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const previewZoom = previewZoomLevels[previewZoomIndex];
  const previewScale = previewZoom / 100;

  useLayoutEffect(() => {
    const surface = previewScrollRef.current;
    if (surface) {
      // Centra la pieza cuando cambia su escala o vuelve a abrirse la vista previa.
      surface.scrollLeft = (surface.scrollWidth - surface.clientWidth) / 2;
      surface.scrollTop = (surface.scrollHeight - surface.clientHeight) / 2;
    }
  }, [previewZoom, boxSize, canvasView, batchMode]);

  return (
    <section
      ref={stageRef}
      className="studio-stage-panel"
      aria-label="Lienzo de vista previa"
    >
      <div className="studio-canvas-well">
        <div
          className="studio-canvas-toggle"
          role="group"
          aria-label="Vista del lienzo"
        >
          <button
            type="button"
            className="detail-tool-icon-btn"
            aria-pressed={canvasView === "preview"}
            title="Vista previa"
            aria-label="Vista previa"
            onClick={() => setCanvasView("preview")}
          >
            <Eye />
          </button>
          <button
            type="button"
            className="detail-tool-icon-btn"
            aria-pressed={canvasView === "code"}
            title="Ver código"
            aria-label="Ver código"
            onClick={() => setCanvasView("code")}
          >
            <Code />
          </button>
        </div>

        {canvasView === "preview" ? (
          batchItems.length > 0 ? (
            <>
              <div className="studio-batch-grid" aria-label="Vista previa del paquete">
                {batchItems.map(({ id, label, url }) => {
                  const thumbScale = Math.min(1, 96 / Math.max(boxSize, 1));
                  const thumbBox = Math.round(boxSize * thumbScale);
                  const thumbIcon = fittedIconSize * thumbScale;

                  return (
                    <div key={id} className="studio-batch-item" title={label}>
                      <div
                        className="studio-badge-preview"
                        style={{
                          ...stagePreviewStyle,
                          width: `${thumbBox}px`,
                          height: `${thumbBox}px`,
                        }}
                        data-icon-gradient={iconGradient || undefined}
                      >
                        <IconArtwork src={url} size={thumbIcon} label={label} />
                      </div>
                      <span>{label}</span>
                    </div>
                  );
                })}
              </div>
              <span className="detail-well-badge detail-well-tl">
                Paquete · {batchItems.length} {batchItems.length === 1 ? "icono" : "iconos"}
              </span>
              <span className="detail-well-badge detail-well-br">
                {boxSize}×{boxSize} px
              </span>
            </>
          ) : (
            <>
              <div ref={previewScrollRef} className="studio-preview-scroll" tabIndex={0} role="region" aria-label="Vista ampliable del icono">
                <div className="studio-preview-space">
                  <div
                    className="studio-badge-preview studio-badge-preview--single"
                    style={{
                      ...stagePreviewStyle,
                      width: boxSize * previewScale,
                      height: boxSize * previewScale,
                    }}
                    data-icon-gradient={iconGradient || undefined}
                  >
                    {activeDrawing && (
                      <IconArtwork src={activeDrawing.url} size={fittedIconSize * previewScale} label={activeLabel} />
                    )}
                  </div>
                </div>
              </div>
              <div className="studio-zoom-controls" role="group" aria-label="Zoom del lienzo">
                <button
                  type="button"
                  className="detail-tool-icon-btn"
                  aria-label="Alejar"
                  disabled={previewZoomIndex === 0}
                  onClick={() => setPreviewZoomIndex(previewZoomIndex - 1)}
                >
                  <Minus aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="studio-zoom-value"
                  aria-label={`Zoom ${previewZoom} %. Volver a tamaño real`}
                  title="Volver a tamaño real"
                  onClick={() => setPreviewZoomIndex(actualSizeZoomIndex)}
                >
                  {previewZoom} %
                </button>
                <button
                  type="button"
                  className="detail-tool-icon-btn"
                  aria-label="Acercar"
                  disabled={previewZoomIndex === previewZoomLevels.length - 1}
                  onClick={() => setPreviewZoomIndex(previewZoomIndex + 1)}
                >
                  <Plus aria-hidden="true" />
                </button>
              </div>
              <span className="detail-well-badge detail-well-tl">
                {activeLabel ?? "Icono"}
              </span>
              <span className="detail-well-badge detail-well-br">
                {boxSize}×{boxSize} px
              </span>
            </>
          )
        ) : (
          <div className="studio-canvas-code">
            <div className="detail-code-header">
              <div
                className="detail-code-tabs"
                role="tablist"
                  onKeyDown={navigateTabs}
                aria-label="Formato de código"
              >
                {codeFormats.map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={codeFormat === id}
                    tabIndex={codeFormat === id ? 0 : -1}
                    onClick={() => setCodeFormat(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="detail-copy-mini"
                disabled={!badgeCodeSnippet}
                onClick={() => onCopyCode()}
              >
                {copiedCode ? <Check /> : <Copy />}
                <span>
                  {copiedCode ? "Copiado" : "Copiar"}
                </span>
              </button>
            </div>
            {batchMode && componentFormat && activeLabel && (
              <p className="studio-size-hint">Componente de {activeLabel}</p>
            )}
            <pre className="detail-code-block studio-canvas-pre">
              <code>{badgeCodeSnippet
                ? highlightCode(badgeCodeSnippet, codeFormat === "css" ? "css" : "markup")
                : drawingLoaded
                  ? "No se pudo cargar el icono."
                  : "Cargando el icono…"}</code>
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
