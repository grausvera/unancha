"use client";

import "../styles/studio.css";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react";
import {
  Minus,
  Plus,
} from "@grausvera/unancha/icons";
import { ColorPickerControls } from "../components/color-picker-controls";
import { hexToHsv } from "../lib/color";
import { renderSvgStringToPngBlob, triggerBlobDownload } from "../lib/svg-export";
import { StudioCanvas, type CanvasView, type CodeFormat } from "./canvas";
import {
  filterStudioIcons,
  getStudioDrawing,
  getStudioIcons,
  type StudioDrawing,
  type StudioVariant,
} from "./catalogue";
import { BorderControls, type BorderStyle } from "./controls/border-controls";
import { HexColorInput } from "./controls/hex-color-input";
import { SizeControl } from "./controls/size-control";
import { ExportActions } from "./export/actions";
import { buildBadgeBackground, type BgStyle, type GradientStop } from "./export/badge-background";
import { buildBadgeCodeSnippet, composeBadgeSvg } from "./export/badge-code";
import { buildZipBlob } from "./export/zip";
import { fitIconSize } from "./geometry";
import { StudioPicker } from "./icon-picker";

const minimumIconSize = 1;
const minimumContainerSize = 8;
const maximumIconSize = 264;
const maximumContainerSize = 384;


const defaultIconColor = "#fff0b5";
const defaultBackgroundColor = "#631c4a";
const defaultBackgroundEnd = "#ac4929";

const stopPalette = ["#f87171", "#60a5fa", "#6ee7b7", "#fcd34d", "#c4b5fd", "#f472b6"] as const;

/** Crea una nueva parada en la posición indicada o en el mayor hueco disponible. */
function createNextStop(prev: GradientStop[], prefix: string, clickPct?: number): GradientStop {
  let pos = clickPct;
  if (pos === undefined) {
    const sorted = [...prev].sort((a, b) => a.pos - b.pos);
    let bestGap = -1;
    let bestMid = 50;

    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = sorted[i + 1].pos - sorted[i].pos;
      if (gap > bestGap) {
        bestGap = gap;
        bestMid = Math.round((sorted[i].pos + sorted[i + 1].pos) / 2);
      }
    }

    pos = bestMid;
  }

  const color = stopPalette[prev.length % stopPalette.length];

  return { id: `${prefix}${Date.now()}`, color, pos };
}

/** Taller interactivo de iconos Forma: generador de badges y constructor de kits. */
export function Studio({ catalogue }: { catalogue: StudioDrawing[] }) {
  const [canvasView, setCanvasView] = useState<CanvasView>("preview");
  const [codeFormat, setCodeFormat] = useState<CodeFormat>("svg");
  const [batchMode, setBatchMode] = useState(false);
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [variant, setVariant] = useState<StudioVariant>("line");
  const stageRef = useRef<HTMLElement>(null);

  const icons = useMemo(() => getStudioIcons(catalogue), [catalogue]);
  const [selectedId, setSelectedId] = useState(() => icons[0]?.assetId ?? "");

  // Estado del generador de badge
  const [hasBackground, setHasBackground] = useState(true);
  const [cornerRadius, setCornerRadius] = useState(24);
  const [vertices, setVertices] = useState(0);
  const [starDepth, setStarDepth] = useState(0);
  const [bgStyle, setBgStyle] = useState<BgStyle>("gradient");
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("none");
  const [borderWidth, setBorderWidth] = useState(2);
  const [borderColor, setBorderColor] = useState("#fff0b5");
  const [bgGradType, setBgGradType] = useState<"linear" | "radial">("linear");
  const [bgGradAngle, setBgGradAngle] = useState(145);
  const [iconColor, setIconColor] = useState(defaultIconColor);
  const [iconGradient, setIconGradient] = useState(false);
  const [iconStops, setIconStops] = useState<GradientStop[]>([
    { id: "i1", color: defaultIconColor, pos: 0 },
    { id: "i2", color: "#ffe094", pos: 100 },
  ]);
  const [activeIconStopId, setActiveIconStopId] = useState("i1");
  const [bgColor, setBgColor] = useState(defaultBackgroundColor);
  const [bgStops, setBgStops] = useState<GradientStop[]>([
    { id: "b1", color: defaultBackgroundColor, pos: 0 },
    { id: "b2", color: defaultBackgroundEnd, pos: 100 },
  ]);
  const [activeBgStopId, setActiveBgStopId] = useState("b1");
  const [iconSize, setIconSize] = useState(64);
  const [boxSize, setBoxSize] = useState(144);
  const [copiedKey, setCopiedKey] = useState("");
  const [activeColorSlot, setActiveColorSlot] = useState<"icon" | "bg" | "border" | null>(null);
  const [hsv, setHsv] = useState<[number, number, number]>(() => hexToHsv(defaultIconColor));

  useEffect(() => {
    if (!activeColorSlot) {
      return;
    }

    /** Cierra la paleta después del clic para que su cierre no desplace el control pulsado. */
    function dismissOutsideColor(event: MouseEvent) {
      const target = event.target;
      if (target instanceof Element && !target.closest(
        ".studio-fill-box :is(.explorer-color-popover, .studio-figma-color-chip, .studio-figma-hex-input, .studio-grad-bar, .studio-gradient-action)",
      )) {
        setActiveColorSlot(null);
      }
    }

    document.addEventListener("click", dismissOutsideColor);

    return () => document.removeEventListener("click", dismissOutsideColor);
  }, [activeColorSlot]);

  const maximumBorderWidth = Math.min(24, Math.floor(boxSize / 4));
  const visibleBorderWidth = hasBackground && borderStyle !== "none" ? Math.min(borderWidth, maximumBorderWidth) : 0;
  const fittedIconSize = fitIconSize(iconSize, boxSize, hasBackground, cornerRadius, vertices, starDepth, visibleBorderWidth);

  /** Inicia el arrastre fluido de una parada de degradado usando eventos globales de ventana. */
  function startStopDrag(
    kind: "icon" | "bg",
    stopId: string,
    barEl: HTMLElement | null,
  ) {
    if (!barEl) {
      return;
    }

    /** Convierte el desplazamiento horizontal en la posición de la parada activa. */
    const onMove = (ev: PointerEvent) => {
      const rect = barEl.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(100, Math.round(((ev.clientX - rect.left) / rect.width) * 100)),
      );

      if (kind === "icon") {
        setIconStops((prev) =>
          prev.map((s) => (s.id === stopId ? { ...s, pos: pct } : s)),
        );
      } else {
        setBgStops((prev) =>
          prev.map((s) => (s.id === stopId ? { ...s, pos: pct } : s)),
        );
      }
    };

    /** Libera los escuchadores globales para que el movimiento normal no siga editando. */
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  /** Abre o cierra el selector de una parte de la pieza y sincroniza su color. */
  function openColorSlot(slot: "icon" | "bg" | "border", currentHex: string) {
    if (activeColorSlot === slot) {
      setActiveColorSlot(null);

      return;
    }

    setActiveColorSlot(slot);
    setHsv(hexToHsv(currentHex));
  }

  /** Aplica el color a la pieza o a la parada de degradado seleccionada. */
  function applySlotHex(nextHex: string) {
    if (activeColorSlot === "icon") {
      if (iconGradient) {
        setIconStops((prev) =>
          prev.map((s) => (s.id === activeIconStopId ? { ...s, color: nextHex } : s)),
        );
      } else {
        setIconColor(nextHex);
      }
    } else if (activeColorSlot === "bg") {
      if (bgStyle === "gradient") {
        setBgStops((prev) =>
          prev.map((s) => (s.id === activeBgStopId ? { ...s, color: nextHex } : s)),
        );
      } else {
        setBgColor(nextHex);
      }
    } else if (activeColorSlot === "border") {
      setBorderColor(nextHex);
    }
  }

  /** Renderiza los controles de color compartidos por icono, relleno y borde. */
  function renderColorPalette(label: string) {
    return (
      <div className="explorer-color-popover" role="dialog" aria-label={label}>
        <ColorPickerControls
          hsv={hsv}
          onChange={(next, hex) => {
            setHsv(next);
            applySlotHex(hex);
          }}
        />
      </div>
    );
  }

  const filteredIcons = useMemo(() => filterStudioIcons(icons, query), [icons, query]);

  const activeIcon = useMemo(
    () => icons.find((i) => i.assetId === selectedId) ?? icons[0],
    [icons, selectedId],
  );

  const activeDrawing = getStudioDrawing(activeIcon, variant);

  const [loadedDrawing, setLoadedDrawing] = useState<{ url: string; text: string }>();
  const activeSvgText = loadedDrawing?.url === activeDrawing?.url ? (loadedDrawing?.text ?? "") : "";
  const componentFormat = codeFormat === "react" || codeFormat === "vue" || codeFormat === "svelte";

  useEffect(() => {
    const url = activeDrawing?.url;
    if (!url) {
      setLoadedDrawing(undefined);

      return;
    }

    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => (res.ok ? res.text() : ""))
      .then((text) => {
        if (!controller.signal.aborted) {
          setLoadedDrawing({ url, text: text.trim() });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoadedDrawing({ url, text: "" });
        }
      });

    return () => controller.abort();
  }, [activeDrawing?.url]);

  const backgroundMarkup = useMemo(() => buildBadgeBackground({
    hasBackground,
    bgStyle,
    bgColor,
    bgStops,
    bgGradType,
    bgGradAngle,
    boxSize,
    vertices,
    starDepth,
    cornerRadius,
    borderStyle,
    borderColor,
    visibleBorderWidth,
  }), [hasBackground, bgStyle, bgColor, bgStops, bgGradType, bgGradAngle, boxSize, vertices, starDepth, cornerRadius, borderStyle, borderColor, visibleBorderWidth]);

  const backgroundImage = useMemo(() => {
    if (!backgroundMarkup) {
      return "none";
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boxSize} ${boxSize}">${backgroundMarkup}</svg>`;

    return `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, "%27")}")`;
  }, [backgroundMarkup, boxSize]);

  const badgeAppearance = useMemo(() => ({
    backgroundMarkup,
    boxSize,
    fittedIconSize,
    iconColor,
    iconGradient,
    iconStops,
  }), [backgroundMarkup, boxSize, fittedIconSize, iconColor, iconGradient, iconStops]);

  const badgeCodeSnippet = useMemo(() => {
    if (canvasView !== "code") {
      return "";
    }

    return buildBadgeCodeSnippet({
      format: codeFormat,
      activeDrawing,
      activeIcon,
      rawSvg: activeSvgText,
      batchMode,
      batchIds,
      icons,
      backgroundImage,
      appearance: badgeAppearance,
    });
  }, [
    canvasView,
    codeFormat,
    activeDrawing,
    activeIcon,
    activeSvgText,
    batchMode,
    batchIds,
    icons,
    backgroundImage,
    badgeAppearance,
  ]);

  /** Exporta en lote los iconos seleccionados en un único paquete .zip con el diseño actual. */
  async function exportBatchZip() {
    const files: Array<{ name: string; content: string }> = [];

    for (const id of batchIds) {
      const item = icons.find((i) => i.assetId === id);
      const drawing = getStudioDrawing(item, variant);
      if (!drawing) {
        continue;
      }

      try {
        const res = await fetch(drawing.url);
        if (!res.ok) {
          continue;
        }

        const rawSvg = await res.text();
        files.push({
          name: `unancha-${id.replace(/^icons\//, "")}.svg`,
          content: composeBadgeSvg(rawSvg, badgeAppearance),
        });
      } catch {
        // Continúa con el siguiente icono.
      }
    }

    if (!files.length) {
      return;
    }

    const zipBlob = buildZipBlob(files);
    triggerBlobDownload(zipBlob, "unancha-estudio-kit.zip");
  }

  /** Copia texto al portapapeles con confirmación breve. */
  async function copyText(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((c) => (c === key ? "" : c)), 1800);
    } catch {
      setCopiedKey("");
    }
  }

  /** Genera el SVG compuesto (contenedor + icono) y lo descarga o copia. */
  async function exportBadgeSvg(action: "copy" | "download") {
    if (!activeDrawing) {
      return;
    }

    try {
      const rawSvg =
        activeSvgText ||
        (await fetch(activeDrawing.url).then((r) => (r.ok ? r.text() : "")));
      if (!rawSvg) {
        return;
      }

      const composed = composeBadgeSvg(rawSvg, badgeAppearance);

      if (action === "copy") {
        await copyText(composed, "badge-svg");
      } else {
        const blob = new Blob([composed], { type: "image/svg+xml;charset=utf-8" });
        triggerBlobDownload(
          blob,
          `unancha-${activeIcon?.assetId.replace(/^icons\//, "") ?? "badge"}.svg`,
        );
      }
    } catch {
      // Silencio si falla la lectura.
    }
  }

  /** Renderiza el badge compuesto como imagen PNG y lo copia o descarga. */
  async function exportBadgePng(action: "copy" | "download") {
    if (!activeDrawing) {
      return;
    }

    try {
      const rawSvg =
        activeSvgText ||
        (await fetch(activeDrawing.url).then((r) => (r.ok ? r.text() : "")));
      if (!rawSvg) {
        return;
      }

      const composed = composeBadgeSvg(rawSvg, badgeAppearance);
      const blob = await renderSvgStringToPngBlob(composed, Math.max(boxSize * 2, 256));
      if (!blob) {
        return;
      }

      if (action === "copy") {
        if (typeof ClipboardItem === "undefined") {
          return;
        }

        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopiedKey("badge-png");
        window.setTimeout(() => setCopiedKey((c) => (c === "badge-png" ? "" : c)), 1800);
      } else {
        triggerBlobDownload(
          blob,
          `unancha-${activeIcon?.assetId.replace(/^icons\//, "") ?? "badge"}.png`,
        );
      }
    } catch {
      // Silencio si falla la exportación PNG.
    }
  }

  /** Inicia un paquete con el icono activo si todavía no hay selección. */
  function toggleBatchMode() {
    if (!batchMode && batchIds.length === 0 && activeIcon) {
      setBatchIds([activeIcon.assetId]);
    }

    setBatchMode(!batchMode);
  }

  const pickerSelection = useMemo(() => batchMode ? batchIds : [selectedId], [batchMode, batchIds, selectedId]);

  /** Selecciona una pieza y conserva al menos un icono en el lote. */
  const pickIcon = useCallback((assetId: string) => {
    if (!batchMode) {
      setSelectedId(assetId);

      return;
    }

    setBatchIds((previous) => {
      if (previous.includes(assetId)) {
        return previous.length > 1 ? previous.filter((id) => id !== assetId) : previous;
      }

      return [...previous, assetId];
    });
  }, [batchMode]);

  const batchItems = useMemo(() => batchMode ? batchIds.flatMap((id) => {
    const item = icons.find((icon) => icon.assetId === id);
    const drawing = getStudioDrawing(item, variant);

    return item && drawing ? [{ id, label: item.label, url: drawing.url }] : [];
  }) : [], [batchMode, batchIds, icons, variant]);

  const sortedIconStops = [...iconStops].sort((a, b) => a.pos - b.pos);
  const iconCssStops = sortedIconStops.map((s) => `${s.color} ${s.pos}%`).join(", ");

  const bgCssStops = [...bgStops].sort((a, b) => a.pos - b.pos).map((stop) => `${stop.color} ${stop.pos}%`).join(", ");

  const stagePreviewStyle = {
    width: boxSize,
    height: boxSize,
    color: iconColor,
    "--icon-grad": `linear-gradient(135deg, ${iconCssStops})`,
    background: `${backgroundImage} center / contain no-repeat`,
  } as CSSProperties;

  /** Destapa el control enfocado si el lienzo fijo está encima en el diseño apilado. */
  function revealFocusedControl(event: FocusEvent<HTMLElement>) {
    const stage = stageRef.current;
    if (!stage || !event.target.matches(":focus-visible") || getComputedStyle(stage).position !== "sticky") {
      return;
    }

    const preview = stage.getBoundingClientRect();
    const control = event.target.getBoundingClientRect();
    if (control.top < preview.bottom && control.left < preview.right && control.right > preview.left) {
      window.scrollBy({ top: control.top - preview.bottom - 8, behavior: "instant" });
    }
  }

  return (
    <main id="content" tabIndex={-1} className="studio-page">
      <h1 className="visually-hidden">Estudio de iconos Forma</h1>
      <div className="studio-layout" data-mode="badge">
        <StudioPicker items={filteredIcons} query={query} selectedIds={pickerSelection} onQuery={setQuery} onSelect={pickIcon} />

        <StudioCanvas
          stageRef={stageRef}
          canvasView={canvasView}
          setCanvasView={setCanvasView}
          codeFormat={codeFormat}
          setCodeFormat={setCodeFormat}
          batchMode={batchMode}
          batchItems={batchItems}
          boxSize={boxSize}
          fittedIconSize={fittedIconSize}
          stagePreviewStyle={stagePreviewStyle}
          iconGradient={iconGradient}
          activeDrawing={activeDrawing}
          activeLabel={activeIcon?.label}
          badgeCodeSnippet={badgeCodeSnippet}
          componentFormat={componentFormat}
          drawingLoaded={loadedDrawing?.url === activeDrawing?.url}
          onCopyCode={() => void copyText(badgeCodeSnippet, "canvas-code")}
          copiedCode={copiedKey === "canvas-code"}
        />

        <aside
          className="studio-controls-card studio-controls-sidebar"
          aria-label="Opciones de personalización"
          onFocusCapture={revealFocusedControl}
        >
          <section className="studio-inspector-section">
            <div className="studio-section-head">
              <h2>Icono</h2>
              <div
                className="studio-mini-tabs"
                role="group"
                aria-label="Variante del icono"
              >
                <button
                  type="button"
                  aria-pressed={variant === "line"}
                  title="Trazo de contorno"
                  onClick={() => setVariant("line")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="4" />
                  </svg>
                  <span>Contorno</span>
                </button>
                <button
                  type="button"
                  aria-pressed={variant === "filled"}
                  title="Relleno sólido"
                  onClick={() => setVariant("filled")}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="4" />
                  </svg>
                  <span>Sólido</span>
                </button>
              </div>
            </div>

            <SizeControl
              label="Tamaño"
              accessibleLabel="Tamaño del icono"
              value={iconSize}
              actualSize={fittedIconSize}
              min={minimumIconSize}
              max={maximumIconSize}
              onChange={setIconSize}
            />

            {fittedIconSize < iconSize && (
              <p className="studio-size-hint">El icono se ajusta al contenedor. Tamaño solicitado: {iconSize} px.</p>
            )}

            <div className="studio-fill-box">
              {(() => {
                const activeIconStop = iconStops.find((s) => s.id === activeIconStopId) ?? iconStops[0];
                const activeIconHex = iconGradient ? activeIconStop.color : iconColor;

                return (
                  <div className="studio-figma-fill-row">
                    <button
                      type="button"
                      className="studio-figma-color-chip"
                      data-active={activeColorSlot === "icon" || undefined}
                      aria-expanded={activeColorSlot === "icon"}
                      title="Elegir color"
                      onClick={() => openColorSlot("icon", activeIconHex)}
                    >
                      <span className="studio-figma-swatch-sq" style={{ background: activeIconHex }} />
                    </button>

                    <HexColorInput
                      value={activeIconHex}
                      onChangeColor={(nextHex) => {
                        if (iconGradient) {
                          setIconStops((prev) =>
                            prev.map((s) => (s.id === activeIconStop.id ? { ...s, color: nextHex } : s)),
                          );
                        } else {
                          setIconColor(nextHex);
                        }

                        if (activeColorSlot === "icon") {
                          setHsv(hexToHsv(nextHex));
                        }
                      }}
                    />

                    {iconGradient && (
                      <>
                        <button
                          type="button"
                          className="studio-icon-btn studio-gradient-action"
                          title="Agregar color al degradado"
                          aria-label="Agregar color al degradado"
                          onClick={() => {
                            const nextStop = createNextStop(iconStops, "i");

                            setIconStops((prev) => [...prev, nextStop]);
                            setActiveIconStopId(nextStop.id);
                            setActiveColorSlot("icon");
                            setHsv(hexToHsv(nextStop.color));
                          }}
                        >
                          <Plus aria-hidden="true" />
                        </button>
                        {iconStops.length > 2 && (
                          <button
                            type="button"
                            className="studio-icon-btn studio-gradient-action"
                            title="Quitar color seleccionado"
                            aria-label="Quitar color seleccionado"
                            onClick={() => {
                              setIconStops((prev) => {
                                const next = prev.filter((s) => s.id !== activeIconStopId);
                                if (next.length > 0) {
                                  setActiveIconStopId(next[0].id);

                                  if (activeColorSlot === "icon") {
                                    setHsv(hexToHsv(next[0].color));
                                  }
                                }

                                return next;
                              });
                            }}
                          >
                            <Minus aria-hidden="true" />
                          </button>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      className="studio-icon-btn"
                      aria-pressed={iconGradient}
                      title={iconGradient ? "Quitar degradado del icono" : "Activar degradado en el icono"}
                      aria-label="Degradado en icono"
                      onClick={() => setIconGradient((v) => !v)}
                      style={{ marginLeft: "auto" }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <defs>
                          <linearGradient id="ui-grad-btn" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#ffffff" />
                            <stop offset="100%" stopColor="#52525b" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="8" fill="url(#ui-grad-btn)" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                  </div>
                );
              })()}

              {iconGradient && (
                <div className="studio-figma-stops-row">
                  {iconStops.map((stop) => (
                    <button
                      key={stop.id}
                      type="button"
                      className="studio-figma-color-chip"
                      data-active={(activeColorSlot === "icon" && activeIconStopId === stop.id) || undefined}
                      aria-expanded={activeColorSlot === "icon" && activeIconStopId === stop.id}
                      title="Elegir color"
                      onClick={() => {
                        if (activeColorSlot === "icon" && activeIconStopId !== stop.id) {
                          setActiveIconStopId(stop.id);
                          setHsv(hexToHsv(stop.color));

                          return;
                        }

                        setActiveIconStopId(stop.id);
                        openColorSlot("icon", stop.color);
                      }}
                    >
                      <span className="studio-figma-swatch-sq" style={{ background: stop.color }} />
                    </button>
                  ))}
                </div>
              )}

              {iconGradient && (
                <div
                  className="studio-grad-bar"
                  style={{ background: `linear-gradient(to right, ${iconCssStops})` }}
                  onPointerDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                    const nextStop = createNextStop(iconStops, "i", pct);

                    setIconStops((prev) => [...prev, nextStop]);
                    setActiveIconStopId(nextStop.id);
                    setActiveColorSlot("icon");
                    setHsv(hexToHsv(nextStop.color));
                    startStopDrag("icon", nextStop.id, e.currentTarget);
                  }}
                >
                  {iconStops.map((stop) => (
                    <button
                      key={stop.id}
                      type="button"
                      className="studio-grad-handle"
                      data-active={(activeColorSlot === "icon" && activeIconStopId === stop.id) || undefined}
                      style={{ left: `${stop.pos}%`, background: stop.color }}
                      aria-label="Parada de degradado"
                      title="Arrastra para mover · Doble clic para quitar"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setActiveIconStopId(stop.id);
                        setActiveColorSlot("icon");
                        setHsv(hexToHsv(stop.color));
                        startStopDrag("icon", stop.id, e.currentTarget.parentElement);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();

                        if (iconStops.length <= 2) {
                          return;
                        }

                        setIconStops((prev) => {
                          const next = prev.filter((s) => s.id !== stop.id);
                          if (next.length > 0 && activeIconStopId === stop.id) {
                            setActiveIconStopId(next[0].id);
                            setHsv(hexToHsv(next[0].color));
                          }

                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              )}

              {activeColorSlot === "icon" && renderColorPalette("Selector de color del icono")}
            </div>
          </section>

          <section className="studio-inspector-section">
            <div className="studio-section-head">
              <h2>Contenedor</h2>
              <div className="studio-mini-tabs" role="group" aria-label="Visibilidad del fondo">
                <button
                  type="button"
                  aria-pressed={hasBackground}
                  title="Mostrar contenedor"
                  onClick={() => setHasBackground(true)}
                >
                  <span>Visible</span>
                </button>
                <button
                  type="button"
                  aria-pressed={!hasBackground}
                  title="Ocultar contenedor"
                  onClick={() => setHasBackground(false)}
                >
                  <span>Sin fondo</span>
                </button>
              </div>
            </div>

            <div className="studio-prop-stack">
              <SizeControl
                label="Dimensión"
                accessibleLabel="Dimensión del contenedor"
                value={boxSize}
                min={minimumContainerSize}
                max={maximumContainerSize}
                onChange={setBoxSize}
              />

              <label
                className="studio-prop-row"
                data-disabled={!hasBackground || vertices >= 3 || undefined}
              >
                <span className="studio-prop-label">Redondeo</span>
                <input
                  type="range"
                  min={0}
                  max={50}
                  disabled={!hasBackground || vertices >= 3}
                  value={cornerRadius}
                  onChange={(e) => setCornerRadius(e.currentTarget.valueAsNumber)}
                />
                <output className="studio-prop-val">{cornerRadius} %</output>
              </label>

              <label className="studio-prop-row">
                <span className="studio-prop-label">Vértices</span>
                <input
                  type="range"
                  min={0}
                  max={12}
                  disabled={!hasBackground}
                  value={vertices}
                  onChange={(e) => {
                    const val = e.currentTarget.valueAsNumber;
                    setVertices(val > 0 && val < 3 ? 3 : val);
                  }}
                />
                <output className="studio-prop-val">
                  {vertices >= 3 ? `${vertices} lados` : "Cuadro"}
                </output>
              </label>

              <label
                className="studio-prop-row"
                data-disabled={!hasBackground || vertices < 3 || undefined}
              >
                <span className="studio-prop-label">Estrella</span>
                <input
                  type="range"
                  min={0}
                  max={75}
                  disabled={!hasBackground || vertices < 3}
                  value={starDepth}
                  onChange={(e) => setStarDepth(e.currentTarget.valueAsNumber)}
                />
                <output className="studio-prop-val">{starDepth} %</output>
              </label>
            </div>
          </section>

          <section
            className="studio-inspector-section"
            data-disabled={!hasBackground || undefined}
          >
            <div className="studio-section-head">
              <h2>Relleno</h2>
              <div className="studio-mini-tabs" role="group" aria-label="Estilo de relleno">
                <button
                  type="button"
                  disabled={!hasBackground}
                  aria-pressed={bgStyle === "gradient"}
                  title="Fondo con degradado"
                  onClick={() => setBgStyle("gradient")}
                >
                  <span>Degradado</span>
                </button>
                <button
                  type="button"
                  disabled={!hasBackground}
                  aria-pressed={bgStyle === "solid"}
                  title="Fondo sólido"
                  onClick={() => setBgStyle("solid")}
                >
                  <span>Sólido</span>
                </button>
                <button
                  type="button"
                  disabled={!hasBackground}
                  aria-pressed={bgStyle === "transparent"}
                  title="Fondo transparente"
                  onClick={() => setBgStyle("transparent")}
                >
                  <span>Sin relleno</span>
                </button>
              </div>
            </div>

            <div className="studio-fill-box">
              {(() => {
                const activeBgStop = bgStops.find((s) => s.id === activeBgStopId) ?? bgStops[0];
                const activeBgHex = bgStyle === "gradient" ? activeBgStop.color : bgColor;

                return (
                  <div className="studio-figma-fill-row">
                    <button
                      type="button"
                      disabled={!hasBackground}
                      className="studio-figma-color-chip"
                      data-active={activeColorSlot === "bg" || undefined}
                      aria-expanded={activeColorSlot === "bg"}
                      title="Color del fondo"
                      onClick={() => openColorSlot("bg", activeBgHex)}
                    >
                      <span className="studio-figma-swatch-sq" style={{ background: activeBgHex }} />
                    </button>

                    <HexColorInput
                      value={activeBgHex}
                      disabled={!hasBackground}
                      onChangeColor={(nextHex) => {
                        if (bgStyle === "gradient") {
                          setBgStops((prev) =>
                            prev.map((s) => (s.id === activeBgStop.id ? { ...s, color: nextHex } : s)),
                          );
                        } else {
                          setBgColor(nextHex);
                        }

                        if (activeColorSlot === "bg") {
                          setHsv(hexToHsv(nextHex));
                        }
                      }}
                    />

                    {bgStyle === "gradient" && (
                      <>
                        <button
                          type="button"
                          disabled={!hasBackground}
                          className="studio-icon-btn studio-gradient-action"
                          title="Agregar color al degradado"
                          aria-label="Agregar color al degradado"
                          onClick={() => {
                            const nextStop = createNextStop(bgStops, "b");

                            setBgStops((prev) => [...prev, nextStop]);
                            setActiveBgStopId(nextStop.id);
                            setActiveColorSlot("bg");
                            setHsv(hexToHsv(nextStop.color));
                          }}
                        >
                          <Plus aria-hidden="true" />
                        </button>
                        {bgStops.length > 2 && (
                          <button
                            type="button"
                            disabled={!hasBackground}
                            className="studio-icon-btn studio-gradient-action"
                            title="Quitar color seleccionado"
                            aria-label="Quitar color seleccionado"
                            onClick={() => {
                              setBgStops((prev) => {
                                const next = prev.filter((s) => s.id !== activeBgStopId);
                                if (next.length > 0) {
                                  setActiveBgStopId(next[0].id);

                                  if (activeColorSlot === "bg") {
                                    setHsv(hexToHsv(next[0].color));
                                  }
                                }

                                return next;
                              });
                            }}
                          >
                            <Minus aria-hidden="true" />
                          </button>
                        )}

                        <div className="studio-icon-pair" role="group" aria-label="Tipo de degradado">
                          <button
                            type="button"
                            className="studio-icon-btn"
                            disabled={!hasBackground}
                            aria-pressed={bgGradType === "linear"}
                            title="Degradado lineal"
                            aria-label="Degradado lineal"
                            onClick={() => setBgGradType("linear")}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                              <path d="M5 19L19 5M13 5h6v6" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="studio-icon-btn"
                            disabled={!hasBackground}
                            aria-pressed={bgGradType === "radial"}
                            title="Degradado radial"
                            aria-label="Degradado radial"
                            onClick={() => setBgGradType("radial")}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <circle cx="12" cy="12" r="8" />
                              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {bgStyle === "gradient" && (
                <div className="studio-figma-stops-row">
                  {bgStops.map((stop) => (
                    <button
                      key={stop.id}
                      type="button"
                      disabled={!hasBackground}
                      className="studio-figma-color-chip"
                      data-active={(activeColorSlot === "bg" && activeBgStopId === stop.id) || undefined}
                      aria-expanded={activeColorSlot === "bg" && activeBgStopId === stop.id}
                      title="Color del fondo"
                      onClick={() => {
                        if (activeColorSlot === "bg" && activeBgStopId !== stop.id) {
                          setActiveBgStopId(stop.id);
                          setHsv(hexToHsv(stop.color));

                          return;
                        }

                        setActiveBgStopId(stop.id);
                        openColorSlot("bg", stop.color);
                      }}
                    >
                      <span className="studio-figma-swatch-sq" style={{ background: stop.color }} />
                    </button>
                  ))}
                </div>
              )}

              {bgStyle === "gradient" && (
                <div
                  className="studio-grad-bar"
                  style={{ background: `linear-gradient(to right, ${bgCssStops})` }}
                  onPointerDown={(e) => {
                    if (!hasBackground) {
                      return;
                    }

                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
                    const nextStop = createNextStop(bgStops, "b", pct);

                    setBgStops((prev) => [...prev, nextStop]);
                    setActiveBgStopId(nextStop.id);
                    setActiveColorSlot("bg");
                    setHsv(hexToHsv(nextStop.color));
                    startStopDrag("bg", nextStop.id, e.currentTarget);
                  }}
                >
                  {bgStops.map((stop) => (
                    <button
                      key={stop.id}
                      type="button"
                      disabled={!hasBackground}
                      className="studio-grad-handle"
                      data-active={(activeColorSlot === "bg" && activeBgStopId === stop.id) || undefined}
                      style={{ left: `${stop.pos}%`, background: stop.color }}
                      aria-label="Parada de degradado"
                      title="Arrastra para mover · Doble clic para quitar"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setActiveBgStopId(stop.id);
                        setActiveColorSlot("bg");
                        setHsv(hexToHsv(stop.color));
                        startStopDrag("bg", stop.id, e.currentTarget.parentElement);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();

                        if (bgStops.length <= 2) {
                          return;
                        }

                        setBgStops((prev) => {
                          const next = prev.filter((s) => s.id !== stop.id);
                          if (next.length > 0 && activeBgStopId === stop.id) {
                            setActiveBgStopId(next[0].id);
                            setHsv(hexToHsv(next[0].color));
                          }

                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
              )}

              {activeColorSlot === "bg" && renderColorPalette("Selector de color de fondo")}

              {bgStyle === "gradient" && bgGradType === "linear" && (
                <label className="studio-prop-row">
                  <span className="studio-prop-label">Ángulo</span>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    disabled={!hasBackground}
                    value={bgGradAngle}
                    onChange={(e) => setBgGradAngle(e.currentTarget.valueAsNumber)}
                  />
                  <output className="studio-prop-val">{bgGradAngle}°</output>
                </label>
              )}
            </div>
          </section>

          <BorderControls
            hasBackground={hasBackground}
            borderStyle={borderStyle}
            setBorderStyle={setBorderStyle}
            borderWidth={borderWidth}
            maximumBorderWidth={maximumBorderWidth}
            setBorderWidth={setBorderWidth}
            borderColor={borderColor}
            paletteOpen={activeColorSlot === "border"}
            onTogglePalette={() => openColorSlot("border", borderColor)}
            onChangeColor={(hex) => {
              setBorderColor(hex);

              if (activeColorSlot === "border") {
                setHsv(hexToHsv(hex));
              }
            }}
            palette={activeColorSlot === "border" && hasBackground ? renderColorPalette("Selector de color del borde") : null}
          />

          <ExportActions
            copiedKey={copiedKey}
            batchMode={batchMode}
            batchCount={batchIds.length}
            onSvg={exportBadgeSvg}
            onPng={exportBadgePng}
            onZip={exportBatchZip}
            onToggleBatch={toggleBatchMode}
          />
        </aside>
      </div>
    </main>
  );
}
