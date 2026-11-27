"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
} from "@grausvera/unancha/icons";
import { IconArtwork } from "../../components/icon-artwork";
import { IconAppearanceControls } from "../../components/icon-appearance-controls";
import { downloadColoredSvg, fetchAndPrepareSvg, prepareStandaloneSvg, renderSvgToPngBlob, triggerBlobDownload } from "../../lib/svg-export";
import { ColorPickerControls } from "../../components/color-picker-controls";
import { hexToHsv } from "../../lib/color";
import { buildFrameworkSnippet, type CodeTab } from "../../lib/framework-code";
import { defaultIconAppearance } from "../../lib/icon-appearance";
import { IntegrationCode } from "../integration-code";
import type { ResourceTag } from "./tags";

export type DetailRevision = {
  key: string;
  name: string;
  label: string;
  revision: number;
  src: string;
  href: string;
  downloadName: string;
  viewBox: string;
  license: string;
  source: string;
  component?: {
    name: string;
  };
};

export type DetailRelatedIcon = {
  id: string;
  slug: string;
  label: string;
  href: string;
  src: string;
};

type DetailClientProps = {
  resource: {
    id: string;
    slug: string;
    label: string;
    group: string;
    groupLabel: string;
    tags: readonly ResourceTag[];
  };
  revisions: DetailRevision[];
  initialRevisionKey: string;
  related: DetailRelatedIcon[];
};

type Backdrop = "grid" | "dark" | "light";

const sizePresets = [16, 24, 32, 64, 128] as const;
const quickSwatches = [
  { hex: "#f5f5f7", label: "Blanco" },
  { hex: "#a1a1aa", label: "Plata" },
  { hex: "#f87171", label: "Rojo" },
  { hex: "#60a5fa", label: "Azul" },
  { hex: "#6ee7b7", label: "Menta" },
  { hex: "#fcd34d", label: "Ámbar" },
  { hex: "#c4b5fd", label: "Violeta" },
] as const;
const backdrops: { id: Backdrop; label: string }[] = [
  { id: "grid", label: "Cuadrícula" },
  { id: "dark", label: "Oscuro" },
  { id: "light", label: "Claro" },
];

/** Ficha interactiva de un icono Forma con mesa de pruebas, código listo para copiar y revisiones. */
export function ResourceDetailClient({
  resource,
  revisions,
  initialRevisionKey,
  related,
}: DetailClientProps) {
  const [activeKey, setActiveKey] = useState(initialRevisionKey);
  const [size, setSize] = useState(96);
  const [backdrop, setBackdrop] = useState<Backdrop>("grid");
  const [color, setColor] = useState("#ffffff");
  const [appearance, setAppearance] = useState(defaultIconAppearance);
  const [hexDraft, setHexDraft] = useState("#ffffff");
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv("#ffffff"));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [guides, setGuides] = useState(true);
  const [codeTab, setCodeTab] = useState<CodeTab>("react");
  const [loadedSvg, setLoadedSvg] = useState<{ src: string; text: string }>();
  const [copiedKey, setCopiedKey] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  const active = revisions.find((item) => item.key === activeKey) ?? revisions[0];
  const svgSource = loadedSvg?.src === active.src ? loadedSvg.text : "";
  const outline = active.name === "line";
  const lineComponent = revisions.find((item) => item.name === "line" && item.component)?.component;
  const hasVariants = Boolean(lineComponent && revisions.some((item) => item.name === "filled" && item.component));
  const variant = active.component && hasVariants && (outline || active.name === "filled")
    ? outline ? "line" : "filled"
    : undefined;
  const exportOptions = { appearance, outline };

  useEffect(() => {
    const controller = new AbortController();

    fetch(active.src, { signal: controller.signal })
      .then((res) => (res.ok ? res.text() : ""))
      .then((text) => {
        if (!controller.signal.aborted) {
          setLoadedSvg({ src: active.src, text: text.trim() });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadedSvg(undefined);
        }
      });

    return () => controller.abort();
  }, [active.src]);

  useEffect(() => {
    if (!pickerOpen) {
      return;
    }

    /** Cierra el selector de color al hacer clic fuera o presionar Escape. */
    function handleOutsideClick(event: MouseEvent) {
      if (pickerRef.current && event.target instanceof Node && !pickerRef.current.contains(event.target)) {
        setPickerOpen(false);
      }
    }

    /** Permite cerrar la paleta con Escape. */
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPickerOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [pickerOpen]);

  /** Cambia la revisión activa y sincroniza la URL sin recargar la página. */
  function selectRevision(revision: DetailRevision) {
    setActiveKey(revision.key);
    setCopiedKey("");

    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", revision.href);
    }
  }

  /** Actualiza el color activo, el borrador hexadecimal y la tupla HSV. */
  function applyHexColor(nextHex: string) {
    setColor(nextHex);
    setHexDraft(nextHex);
    setHsv(hexToHsv(nextHex));
  }

  /** Ajusta el fondo del escenario y asegura contraste si se usa el color por defecto. */
  function selectBackdrop(next: Backdrop) {
    setBackdrop(next);

    if (next === "light" && color.toLowerCase() === "#ffffff") {
      applyHexColor("#111115");
    } else if (next !== "light" && color.toLowerCase() === "#111115") {
      applyHexColor("#ffffff");
    }
  }

  /** Copia un texto al portapapeles y muestra confirmación temporal. */
  async function copyText(value: string, key: string) {
    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 1800);
    } catch {
      setCopiedKey("");
    }
  }

  /** Copia el código SVG de la revisión activa con el color y tamaño seleccionados. */
  async function copySvg() {
    if (svgSource) {
      await copyText(prepareStandaloneSvg(svgSource, color, size, exportOptions), "svg-btn");

      return;
    }

    try {
      const prepared = await fetchAndPrepareSvg(active.src, color, size, exportOptions);
      if (!prepared) {
        return;
      }

      await copyText(prepared, "svg-btn");
    } catch {
      setCopiedKey("");
    }
  }

  /** Copia el icono renderizado como imagen PNG al portapapeles. */
  async function copyPng() {
    try {
      const blob = await renderSvgToPngBlob(active.src, color, size, exportOptions);
      if (!blob || typeof ClipboardItem === "undefined") {
        return;
      }

      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setCopiedKey("png-btn");
      window.setTimeout(() => {
        setCopiedKey((current) => (current === "png-btn" ? "" : current));
      }, 1800);
    } catch {
      setCopiedKey("");
    }
  }

  /** Descarga el icono renderizado como archivo PNG. */
  async function downloadPng() {
    try {
      const blob = await renderSvgToPngBlob(active.src, color, size, exportOptions);
      if (!blob) {
        return;
      }

      triggerBlobDownload(blob, active.downloadName.replace(/\.svg$/i, ".png"));
    } catch {
      // Silencio si el navegador bloquea la descarga.
    }
  }

  /** Restablece la mesa de pruebas a sus valores iniciales. */
  function resetStage() {
    setSize(96);
    setBackdrop("grid");
    applyHexColor("#ffffff");
    setAppearance(defaultIconAppearance);
    setGuides(true);
    setPickerOpen(false);
  }

  const preparedSvg = svgSource ? prepareStandaloneSvg(svgSource, color, size, exportOptions) : "";
  const svgBytes = preparedSvg ? new Blob([preparedSvg]).size : 0;
  const svgSizeLabel = svgBytes > 0 ? (svgBytes >= 1024 ? `${(svgBytes / 1024).toFixed(1)} KB` : `${svgBytes} B`) : "—";
  const activeCode = buildFrameworkSnippet({
    tab: codeTab,
    componentName: variant ? lineComponent?.name : active.component?.name,
    variant,
    src: active.src,
    label: resource.label,
    size,
    color,
    svgSource,
    appearance,
    outline,
  });

  const isStageModified =
    size !== 96 ||
    backdrop !== "grid" ||
    color.toLowerCase() !== "#ffffff" ||
    !guides ||
    appearance !== defaultIconAppearance;

  return (
    <main id="content" tabIndex={-1} className="detail-page">
      <div className="detail-topbar">
        <nav className="breadcrumbs" aria-label="Ruta del recurso">
          <Link href="/explorer" className="detail-back-link">
            <ArrowLeft />
            <span>Explorador</span>
          </Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <Link
            href={`/explorer?group=${encodeURIComponent(resource.group)}`}
            className="detail-group-pill"
          >
            {resource.groupLabel}
          </Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <h1 className="breadcrumb-current">{resource.label}</h1>
        </nav>

        <div className="detail-topbar-meta">
          <button
            type="button"
            className="detail-id-chip"
            onClick={() => copyText(resource.id, "id-chip")}
            title="Copiar identificador"
          >
            <code>{resource.id}</code>
            {copiedKey === "id-chip" ? <Check /> : <Copy />}
          </button>
          <button
            type="button"
            className="detail-id-chip"
            onClick={() => copyText(typeof window !== "undefined" ? window.location.href : active.href, "share-link")}
            title="Copiar enlace a esta ficha"
          >
            {copiedKey === "share-link" ? <Check /> : <ExternalLink />}
            <span>{copiedKey === "share-link" ? "Enlace copiado" : "Compartir"}</span>
          </button>
        </div>
      </div>

      <div className="detail-workbench">
        <section className="detail-stage-column" aria-label="Mesa de pruebas del icono">
          <div className="detail-stage-card">
            <div className="detail-stage-well" data-backdrop={backdrop}>
              <svg
                className="detail-ruler-bg"
                viewBox="0 0 240 240"
                fill="none"
                aria-hidden="true"
                data-active={guides}
              >
                <line x1="120" y1="0" x2="120" y2="240" className="ruler-axis" />
                <line x1="0" y1="120" x2="240" y2="120" className="ruler-axis" />
                <line x1="24" y1="24" x2="216" y2="216" className="ruler-diag" />
                <line x1="216" y1="24" x2="24" y2="216" className="ruler-diag" />
                <circle cx="120" cy="120" r="76" className="ruler-diag" />
                <rect x="44" y="44" width="152" height="152" rx="14" className="ruler-frame" />
              </svg>

              <span className="detail-stage-ink" style={{ color, width: size }}>
                <IconArtwork src={active.src} label={resource.label} svgSource={svgSource} appearance={appearance} outline={outline} />
              </span>

              <span className="detail-well-badge detail-well-tl">
                {active.label}
              </span>
              <span className="detail-well-badge detail-well-bl">{active.viewBox}</span>
              <span className="detail-well-badge detail-well-br">{size} px</span>
            </div>

            <div className="detail-stage-controls">
              <div className="detail-control-row detail-control-row-wrap">
                {revisions.length > 1 && (
                  <div className="explorer-segmented detail-variant-switch" role="group" aria-label="Variantes disponibles">
                    {revisions.map((rev) => (
                      <button
                        key={rev.key}
                        type="button"
                        aria-pressed={rev.key === active.key}
                        onClick={() => selectRevision(rev)}
                      >
                        {rev.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="detail-size-presets" role="group" aria-label="Tamaños predefinidos">
                  {sizePresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={size === preset}
                      onClick={() => setSize(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <label className="detail-size-slider" aria-label="Tamaño personalizado">
                  <input
                    type="range"
                    min={16}
                    max={224}
                    step={1}
                    value={size}
                    onChange={(event) => setSize(event.currentTarget.valueAsNumber)}
                  />
                  <output>{size}px</output>
                </label>
              </div>

              <div className="detail-control-row detail-control-row-wrap">
                <div className="detail-color-cluster" ref={pickerRef}>
                  <div className="detail-swatches" role="group" aria-label="Colores rápidos">
                    {quickSwatches.map((swatch) => (
                      <button
                        key={swatch.hex}
                        type="button"
                        className="detail-swatch"
                        style={{ "--swatch": swatch.hex } as CSSProperties}
                        aria-label={swatch.label}
                        aria-pressed={color.toLowerCase() === swatch.hex}
                        onClick={() => applyHexColor(swatch.hex)}
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    className="explorer-custom-wheel"
                    aria-label="Selector de color personalizado"
                    aria-expanded={pickerOpen}
                    title="Color personalizado"
                    onClick={() => setPickerOpen((open) => !open)}
                  />

                  <input
                    type="text"
                    className="detail-hex-input"
                    value={hexDraft}
                    maxLength={7}
                    aria-label="Código de color hexadecimal"
                    onChange={(event) => {
                      const next = event.currentTarget.value;
                      setHexDraft(next);

                      if (/^#[0-9a-fA-F]{6}$/.test(next)) {
                        setColor(next);
                        setHsv(hexToHsv(next));
                      }
                    }}
                    onBlur={() => setHexDraft(color)}
                  />

                  {pickerOpen && (
                    <div className="detail-color-popover" role="dialog" aria-label="Color personalizado">
                      <ColorPickerControls
                        hsv={hsv}
                        hueMax={360}
                        hueLabel="Tono de color"
                        onChange={(next, hex) => {
                          setHsv(next);
                          setColor(hex);
                          setHexDraft(hex);
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="detail-backdrop-tools">
                  <div className="explorer-segmented" role="group" aria-label="Fondo de vista previa">
                    {backdrops.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={backdrop === item.id}
                        onClick={() => selectBackdrop(item.id)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="detail-tool-icon-btn"
                    aria-pressed={guides}
                    aria-label="Mostrar u ocultar guías geométricas"
                    title={guides ? "Ocultar guías" : "Mostrar guías"}
                    onClick={() => setGuides((current) => !current)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                      <path d="M4 16L16 4l4 4L8 20H4v-4Z" />
                      <path d="M12.5 7.5l2 2M9.5 10.5l2 2M6.5 13.5l2 2" />
                    </svg>
                  </button>

                  {isStageModified && (
                    <button
                      type="button"
                      className="explorer-reset-btn"
                      onClick={resetStage}
                    >
                      Restablecer
                    </button>
                  )}
                </div>
              </div>
              <IconAppearanceControls appearance={appearance} outline={outline} onChange={setAppearance} />
            </div>
          </div>

          <section className="detail-context-card" aria-label="Vista en contexto de interfaz">
            <div className="detail-card-head">
              <h2>Vista en interfaz</h2>
              <span>Componentes de muestra</span>
            </div>

            <div className="detail-ui-samples" aria-hidden="true">
              <span className="detail-sample-btn-primary">
                <IconArtwork src={active.src} size={16} />
                <span>{resource.label}</span>
              </span>
              <span className="detail-sample-btn-ghost">
                <IconArtwork src={active.src} size={16} />
                <span>Acción</span>
              </span>
              <span className="detail-sample-pill">
                <IconArtwork src={active.src} size={14} />
                <span>{resource.slug}</span>
              </span>
              <span className="detail-sample-icon-btn">
                <IconArtwork src={active.src} size={18} />
              </span>
            </div>
          </section>
        </section>

        <aside className="detail-sidebar" aria-label="Exportación e integración">
          <div className="detail-export-grid">
            <div className="detail-export-row-2">
              <button type="button" className="primary-action" onClick={copySvg}>
                {copiedKey === "svg-btn" ? <Check /> : <Copy />}
                <span>{copiedKey === "svg-btn" ? "SVG copiado" : "Copiar SVG"}</span>
              </button>
              <button type="button" className="secondary-action" onClick={copyPng}>
                {copiedKey === "png-btn" ? <Check /> : <Copy />}
                <span>{copiedKey === "png-btn" ? "PNG copiado" : "Copiar PNG"}</span>
              </button>
            </div>
            <div className="detail-export-row-2">
              <button
                type="button"
                className="secondary-action"
                onClick={() => void downloadColoredSvg(active.src, active.downloadName, color, size, exportOptions)}
              >
                <Download />
                <span>Descargar SVG</span>
              </button>
              <button type="button" className="secondary-action" onClick={downloadPng}>
                <Download />
                <span>Descargar PNG</span>
              </button>
            </div>
          </div>

          <section className="detail-side-card" aria-label="Código de integración">
            <div className="detail-code-header">
              <span className="detail-keywords-label">Úsalo con</span>
              <button
                type="button"
                className="detail-copy-mini"
                onClick={() => copyText(activeCode, `code-${codeTab}`)}
                aria-label="Copiar código"
              >
                {copiedKey === `code-${codeTab}` ? <Check /> : <Copy />}
                <span>{copiedKey === `code-${codeTab}` ? "Copiado" : "Copiar"}</span>
              </button>
            </div>

            <IntegrationCode tab={codeTab} onTabChange={setCodeTab} code={activeCode} />
          </section>

          <section className="detail-side-card" aria-labelledby="detail-specs-title">
            <div className="detail-card-head">
              <h2 id="detail-specs-title">Especificaciones</h2>
              <span className="detail-license-pill">
                Licencia{" "}
                {active.license === "MIT" ? (
                  <a href="/licenses/MIT.txt">MIT</a>
                ) : (
                  active.license
                )}
              </span>
            </div>

            <dl className="detail-spec-grid">
              <div className="detail-spec-cell">
                <dt>Categoría</dt>
                <dd>
                  <Link href={`/explorer?group=${encodeURIComponent(resource.group)}`}>
                    {resource.groupLabel}
                  </Link>
                </dd>
              </div>
              <div className="detail-spec-cell">
                <dt>Variante</dt>
                <dd>{active.label} · r{active.revision}</dd>
              </div>
              <div className="detail-spec-cell">
                <dt>Cuadrícula</dt>
                <dd><code>{active.viewBox}</code></dd>
              </div>
              <div className="detail-spec-cell">
                <dt>Peso SVG</dt>
                <dd><code>{svgSizeLabel}</code></dd>
              </div>
            </dl>

            {resource.tags.length > 0 && (
              <div className="detail-keywords-block">
                <span className="detail-keywords-label">Etiquetas</span>
                <div className="detail-keywords" aria-label="Etiquetas relacionadas">
                  {resource.tags.map(({ keyword, label }) => (
                    <Link
                      key={keyword}
                      href={`/explorer?q=${encodeURIComponent(keyword)}`}
                      className="detail-keyword-chip"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="detail-related" aria-labelledby="detail-related-title">
          <div className="detail-related-head">
            <h2 id="detail-related-title">Más en {resource.groupLabel}</h2>
            <Link href={`/explorer?group=${encodeURIComponent(resource.group)}`}>
              Ver categoría completa
            </Link>
          </div>

          <div className="detail-related-grid">
            {related.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="detail-related-card"
                prefetch={true}
              >
                <span className="detail-related-stage">
                  <IconArtwork src={item.src} size={28} />
                </span>
                <span className="detail-related-info">
                  <strong>{item.label}</strong>
                  <code>{item.slug}</code>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
