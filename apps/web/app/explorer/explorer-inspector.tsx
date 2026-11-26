import Link from "next/link";
import { memo, useEffect, useRef, useState, type CSSProperties, type Dispatch, type RefObject, type SetStateAction } from "react";
import { Check, Copy, Download, ExternalLink, X } from "@grausvera/unancha/icons";
import { ColorPickerControls } from "../components/color-picker-controls";
import { IconArtwork } from "../components/icon-artwork";
import { IconAppearanceControls } from "../components/icon-appearance-controls";
import { hexToHsv } from "../lib/color";
import { buildFrameworkSnippet, type CodeTab } from "../lib/framework-code";
import { defaultIconAppearance } from "../lib/icon-appearance";
import { downloadColoredSvg, fetchAndPrepareSvg, renderSvgToPngBlob, triggerBlobDownload } from "../lib/svg-export";
import { getExplorerVariant, type ExplorerItem } from "./catalogue";
import { scales, tintSwatches } from "./colors";
import { IntegrationCode } from "./integration-code";

const previewSwatches = [
  ...tintSwatches,
  { id: "violet", label: "Violeta", color: "#c4b5fd" },
] as const;

type ExplorerInspectorProps = {
  selected?: ExplorerItem;
  panelRef: RefObject<HTMLElement | null>;
  copiedKey: string;
  setCopiedKey: Dispatch<SetStateAction<string>>;
  copyText: (value: string, key: string) => Promise<void>;
  onClose: () => void;
};

/** Gestiona la vista previa y las exportaciones sin volver a renderizar la cuadrícula. */
export const ExplorerInspector = memo(function ExplorerInspector({
  selected, panelRef, copiedKey, setCopiedKey, copyText, onClose,
}: ExplorerInspectorProps) {
  // Estado independiente exclusivo del panel de vista previa (no se ve afectado por la barra global de Explorer).
  const [previewFilled, setPreviewFilled] = useState(false);
  const [previewSize, setPreviewSize] = useState<number>(24);
  const [previewTint, setPreviewTint] = useState<string>("#f5f5f7");
  const [appearance, setAppearance] = useState(defaultIconAppearance);
  const [previewGuides, setPreviewGuides] = useState(true);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [previewCodeTab, setPreviewCodeTab] = useState<CodeTab>("react");
  const [loadedSvg, setLoadedSvg] = useState<{ src: string; text: string }>();
  const [hsv, setHsv] = useState<[number, number, number]>(() =>
    hexToHsv("#f5f5f7"),
  );
  const colorPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colorPickerOpen) {
      return;
    }

    /** Cierra el selector personalizado al hacer clic fuera o pulsar Escape. */
    function onPointerDown(event: PointerEvent) {
      if (
        colorPanelRef.current &&
        event.target instanceof Node &&
        !colorPanelRef.current.contains(event.target)
      ) {
        setColorPickerOpen(false);
      }
    }

    /** Cierra la paleta con Escape sin afectar los demás controles del inspector. */
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setColorPickerOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [colorPickerOpen]);

  /** Aplica un color hexadecimal y sincroniza el selector HSV. */
  function selectPreviewColor(hex: string) {
    setPreviewTint(hex);

    if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
      setHsv(hexToHsv(hex));
    }
  }

  const previewVariant = selected ? getExplorerVariant(selected, previewFilled) : undefined;
  const previewSrc = previewVariant?.src;
  const outline = previewVariant?.name === "line";
  const previewColor = /^#[\da-f]{6}$/i.test(previewTint) ? previewTint : "#f5f5f7";
  const exportOptions = { appearance, outline };
  const previewSvgSource = loadedSvg && loadedSvg.src === previewSrc ? loadedSvg.text : "";
  const needsSvg = previewCodeTab === "svg" || previewCodeTab === "datauri" ||
    (outline && Boolean(appearance.strokeLinecap));
  useEffect(() => {
    if (!previewSrc || !needsSvg || previewSvgSource) {
      return;
    }

    const controller = new AbortController();
    fetch(previewSrc, { signal: controller.signal })
      .then((response) => response.ok ? response.text() : "")
      .then((source) => {
        if (!controller.signal.aborted && source) {
          setLoadedSvg({ src: previewSrc, text: source.trim() });
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [needsSvg, previewSrc, previewSvgSource]);

  /** Descarga el texto SVG de la revisión seleccionada con el color y tamaño actuales y lo copia al portapapeles. */
  async function copySvgSource(src: string) {
    try {
      const svg = await fetchAndPrepareSvg(src, previewColor, previewSize, exportOptions);
      if (!svg) {
        return;
      }

      await copyText(svg, "svg");
    } catch {
      setCopiedKey("");
    }
  }

  if (!selected || !previewVariant) {
    return null;
  }

  const lineComponent = selected.line?.componentName;
  const variant = lineComponent && selected.filled?.componentName ? outline ? "line" : "filled" : undefined;
  const snippet = buildFrameworkSnippet({
    tab: previewCodeTab,
    componentName: variant ? lineComponent : previewVariant.componentName,
    variant,
    src: previewVariant.src,
    label: selected.label,
    size: previewSize,
    color: previewColor,
    svgSource: previewSvgSource,
    appearance,
    outline,
  });

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      className="catalogue-inspector"
      aria-labelledby="inspector-name"
      style={{ "--preview-tint": previewColor } as CSSProperties}
    >
      <header className="inspector-heading">
        <div>
          <span>{selected.groupLabel}</span>
          <h2 id="inspector-name">{selected.label}</h2>
        </div>
        <button
          type="button"
          className="icon-link"
          aria-label="Cerrar inspector"
          onClick={onClose}
        >
          <X />
        </button>
      </header>

      <div className="explorer-inspector-well">
        {previewGuides && (
          <svg
            className="workbench-ruler-bg"
            viewBox="0 0 96 96"
            fill="none"
            aria-hidden="true"
          >
            <path d="M48 0v96M0 48h96" className="ruler-axis" />
            <path d="M0 0l96 96M96 0 0 96" className="ruler-diag" />
            <rect
              x="0.5"
              y="0.5"
              width="95"
              height="95"
              rx="2"
              className="ruler-frame"
              data-active={previewSize === 32}
            />
            <rect
              x="12"
              y="12"
              width="72"
              height="72"
              rx="1.5"
              className="ruler-frame"
              data-active={previewSize === 24}
            />
            <rect
              x="18"
              y="18"
              width="60"
              height="60"
              rx="1"
              className="ruler-frame"
              data-active={previewSize === 20}
            />
            <rect
              x="24"
              y="24"
              width="48"
              height="48"
              rx="1"
              className="ruler-frame"
              data-active={previewSize === 16}
            />
          </svg>
        )}
        <span className="explorer-inspector-ink">
          <IconArtwork
            src={previewVariant.src}
            size={previewSize * 3}
            label={selected.label}
            svgSource={previewSvgSource}
            appearance={appearance}
            outline={outline}
          />
        </span>
        <div className="explorer-well-hud" aria-hidden="true">
          <span>
            {previewSize} × {previewSize} px
          </span>
          <span>
            {previewVariant.label} · r{previewVariant.revision}
          </span>
        </div>
      </div>

      <div className="explorer-preview-section">
        <div
          className="explorer-scale-strip"
          role="group"
          aria-label="Escalas rápidas de vista previa"
        >
          {scales.map((s) => (
            <button
              key={s}
              type="button"
              className="explorer-scale-cell"
              aria-pressed={previewSize === s}
              onClick={() => setPreviewSize(s)}
            >
              <span className="explorer-scale-icon">
                <IconArtwork src={previewVariant.src} size={s} />
              </span>
              <small>{s}px</small>
            </button>
          ))}
        </div>

        <label className="explorer-range-row">
          <span className="explorer-range-head">
            <span>Tamaño personalizado</span>
            <output>{previewSize} px</output>
          </span>
          <input
            type="range"
            min={12}
            max={48}
            step={1}
            value={previewSize}
            onChange={(event) =>
              setPreviewSize(event.currentTarget.valueAsNumber)
            }
          />
        </label>
      </div>

      <div className="explorer-preview-color-panel" ref={colorPanelRef}>
        <div className="explorer-preview-color-top">
          <div className="explorer-hex-pill">
            <span
              className="explorer-hex-dot"
              style={{ background: previewColor }}
              aria-hidden="true"
            />
            <input
              type="text"
              value={previewTint}
              maxLength={7}
              aria-label="Código hexadecimal de color"
              onChange={(event) => {
                const val = event.currentTarget.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
                  selectPreviewColor(val);
                }
              }}
            />
          </div>
          <div className="explorer-top-icon-actions">
            <div
              className="explorer-variant-icons"
              role="group"
              aria-label="Variante de vista previa"
            >
              <button
                type="button"
                className="explorer-variant-icon-btn"
                aria-pressed={!previewFilled}
                aria-label="Contorno"
                title="Contorno"
                onClick={() => setPreviewFilled(false)}
              >
                <IconArtwork
                  src={(selected.line ?? previewVariant).src}
                  size={15}
                />
              </button>
              <button
                type="button"
                className="explorer-variant-icon-btn"
                aria-pressed={previewFilled}
                aria-label="Sólido"
                title="Sólido"
                onClick={() => setPreviewFilled(true)}
              >
                <IconArtwork
                  src={(selected.filled ?? previewVariant).src}
                  size={15}
                />
              </button>
            </div>
            <button
              type="button"
              className="explorer-guide-btn"
              aria-pressed={previewGuides}
              onClick={() => setPreviewGuides((current) => !current)}
            >
              Regla
            </button>
          </div>
        </div>

        <div
          className="explorer-preview-swatches"
          role="group"
          aria-label="Paleta de color de vista previa"
        >
          {previewSwatches.map((swatch) => (
            <button
              key={swatch.id}
              type="button"
              className="explorer-swatch"
              aria-label={swatch.label}
              aria-pressed={previewTint.toLowerCase() === swatch.color}
              style={{ "--swatch": swatch.color } as CSSProperties}
              onClick={() => selectPreviewColor(swatch.color)}
            />
          ))}
          <button
            type="button"
            className="explorer-custom-wheel"
            aria-label="Abrir paleta personalizada"
            aria-expanded={colorPickerOpen}
            title="Elegir color personalizado"
            onClick={() => setColorPickerOpen((open) => !open)}
          />
        </div>

        {colorPickerOpen && (
          <div
            className="explorer-color-popover"
            role="dialog"
            aria-label="Selector de color personalizado"
          >
            <ColorPickerControls
              hsv={hsv}
              onChange={(next, hex) => {
                setHsv(next);
                setPreviewTint(hex);
              }}
            />
          </div>
        )}
      </div>

      <IconAppearanceControls appearance={appearance} outline={outline} onChange={setAppearance} />

      <div className="detail-export-grid" style={{ marginTop: "0.8rem" }}>
        <div className="detail-export-row-2">
          <button
            type="button"
            className="primary-action"
            onClick={() => copySvgSource(previewVariant.src)}
          >
            {copiedKey === "svg" ? <Check /> : <Copy />}
            <span>{copiedKey === "svg" ? "SVG copiado" : "Copiar SVG"}</span>
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={async () => {
              try {
                const blob = await renderSvgToPngBlob(previewVariant.src, previewColor, previewSize, exportOptions);
                if (!blob || typeof ClipboardItem === "undefined") {
                  return;
                }

                await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
                setCopiedKey("png");
                window.setTimeout(() => setCopiedKey((c) => (c === "png" ? "" : c)), 1800);
              } catch {
                setCopiedKey("");
              }
            }}
          >
            {copiedKey === "png" ? <Check /> : <Copy />}
            <span>{copiedKey === "png" ? "PNG copiado" : "Copiar PNG"}</span>
          </button>
        </div>
        <div className="detail-export-row-2">
          <button
            type="button"
            className="secondary-action"
            onClick={() => {
              void downloadColoredSvg(
                previewVariant.src,
                previewVariant.downloadName,
                previewColor,
                previewSize,
                exportOptions,
              );
            }}
          >
            <Download /> Descargar SVG
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={async () => {
              try {
                const blob = await renderSvgToPngBlob(previewVariant.src, previewColor, previewSize, exportOptions);
                if (!blob) {
                  return;
                }

                triggerBlobDownload(blob, previewVariant.downloadName.replace(/\.svg$/i, ".png"));
              } catch {
                // Silencio si el navegador bloquea la descarga.
              }
            }}
          >
            <Download /> Descargar PNG
          </button>
        </div>
      </div>

      <div className="explorer-code-card">
        <div className="explorer-code-head">
          <span>Úsalo con</span>
          <button
            type="button"
            onClick={() => copyText(snippet, "import")}
          >
            {copiedKey === "import" ? <Check /> : <Copy />}
            <span>{copiedKey === "import" ? "Copiado" : "Copiar"}</span>
          </button>
        </div>
        <IntegrationCode tab={previewCodeTab} onTabChange={setPreviewCodeTab} code={snippet} />
      </div>

      <Link className="explorer-detail-link" href={previewVariant.href}>
        <span>
          Abrir ficha de revisión (sha256: {previewVariant.sha256})
        </span>
        <ExternalLink />
      </Link>
    </aside>
  );
});
