"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, Copy, Download, Pause, Play, Search } from "@grausvera/unancha/icons";
import { IconArtwork } from "../components/icon-artwork";
import { downloadColoredSvg } from "../lib/svg-export";
import { useInView, useMotion } from "./motion";
import type { Sample } from "./selection";

const previewScales = [16, 20, 24, 32] as const;
const tintSwatches = [
  { id: "white", label: "Blanco", color: "#f5f5f7" },
  { id: "silver", label: "Plata", color: "#a1a1aa" },
  { id: "red", label: "Rojo", color: "#f87171" },
  { id: "blue", label: "Azul", color: "#60a5fa" },
  { id: "mint", label: "Menta", color: "#6ee7b7" },
  { id: "amber", label: "Ámbar", color: "#fcd34d" },
  { id: "violet", label: "Violeta", color: "#c4b5fd" },
] as const;

/** Presenta el escenario monocromático con textos y mesa interactiva enlazados al scroll. */
export function Opening({
  icons,
  marqueeTop,
  marqueeBottom,
  count,
  revisionCount,
}: {
  icons: Sample[];
  marqueeTop: Sample[];
  marqueeBottom: Sample[];
  count: number;
  revisionCount: number;
}) {
  const stage = useRef<HTMLElement>(null);
  const visible = useInView(stage);
  const motion = useMotion();
  const [selectedId, setSelectedId] = useState(icons[0]?.id ?? "");
  const [filled, setFilled] = useState(false);
  const [scale, setScale] = useState<number>(24);
  const [guides, setGuides] = useState(true);
  const [filter, setFilter] = useState("");
  const [copiedKey, setCopiedKey] = useState("");
  const tint = motion.iconColor;

  useEffect(() => {
    const element = stage.current;
    if (!element || !visible || !motion.enabled) {
      return;
    }

    let frame = 0;

    /** Actualiza el progreso de scroll para enderezar la mesa 3D de forma clara al bajar. */
    function paint() {
      if (element) {
        const raw = Math.max(0, Math.min(1, window.scrollY / 280));
        element.style.setProperty("--hero-progress", raw.toFixed(3));
      }

      frame = 0;
    }

    /** Agrupa las lecturas de scroll en un solo fotograma de animación. */
    function schedule() {
      if (!frame) {
        frame = window.requestAnimationFrame(paint);
      }
    }

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      element.style.removeProperty("--hero-progress");
    };
  }, [visible, motion.enabled]);

  const normalizedFilter = filter.trim().toLowerCase();
  const visibleIcons = icons.filter((item) => {
    if (!normalizedFilter) {
      return true;
    }

    return `${item.label} ${item.slug} ${item.groupLabel}`.toLowerCase().includes(normalizedFilter);
  });
  const active = icons.find((item) => item.id === selectedId) ?? visibleIcons[0] ?? icons[0];
  if (!active) {
    return null;
  }

  const drawing = filled && active.filled ? active.filled : active;
  const importName = filled ? `${active.componentName}Filled` : active.componentName;
  const importStatement = `import { ${importName} } from "@grausvera/unancha/icons";`;
  const installCommand = "pnpm add @grausvera/unancha";
  const heroTitleWords = ["Iconos", "vectoriales", "para", "tu", "interfaz."];

  /** Copia un fragmento al portapapeles y muestra confirmación temporal. */
  async function copySnippet(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? "" : current)), 1800);
    } catch {
      setCopiedKey("");
    }
  }

  return (
    <section className="opening" ref={stage} aria-labelledby="opening-title" data-visible={visible}>
      <div className="opening-grid-backdrop" aria-hidden="true" />
      <div className="opening-container">
        <div className="opening-header">
          <a className="opening-announcement" href="#categories" data-scroll-fx="true">
            <span className="announcement-dot" aria-hidden="true" />
            <span>Forma V0.1</span>
            <span className="announcement-sep" aria-hidden="true">·</span>
            <span className="announcement-muted">{count} iconos · {revisionCount} SVG</span>
            <ArrowRight />
          </a>
          <h1 id="opening-title" className="hero-stagger-title" data-scroll-fx="true">
            {heroTitleWords.map((word, idx) => (
              <span
                key={word}
                className="hero-word"
                style={{ "--word-delay": `${idx * 70}ms` } as CSSProperties}
              >
                {word}{idx < heroTitleWords.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p className="opening-lead" data-scroll-fx="true">
            {count} iconos en contorno y sólido para React, Vue, Svelte, Astro, Angular y JavaScript.
          </p>
          <div className="opening-cta-group" data-scroll-fx="true">
            <Link className="launch-cta" href="/explorer">
              Explorar catálogo <ArrowRight />
            </Link>
            <Link className="launch-secondary-cta" href="/studio">
              Abrir Estudio
            </Link>
            <button
              type="button"
              className="install-pill"
              onClick={() => copySnippet(installCommand, "install")}
              aria-label="Copiar comando de instalación"
            >
              <code>{installCommand}</code>
              {copiedKey === "install" ? <Check /> : <Copy />}
            </button>
          </div>
        </div>

        <div className="hero-workbench-shell" data-scroll-mobile="group" data-scroll-fx="true">
          <div className="hero-workbench" role="region" aria-label="Mesa interactiva de iconos Forma">
            <div className="workbench-specular-beam" aria-hidden="true" />
            <div className="workbench-topbar" data-scroll-mobile="item">
              <div className="workbench-window-meta">
                <span className="workbench-dots" aria-hidden="true"><i /><i /><i /></span>
                <label className="workbench-search">
                  <Search />
                  <input
                    type="search"
                    value={filter}
                    placeholder="Filtrar iconos..."
                    aria-label="Filtrar muestra de iconos"
                    onChange={(event) => setFilter(event.currentTarget.value)}
                  />
                </label>
              </div>

              <div className="workbench-toolbar">
                <div className="workbench-swatches" role="group" aria-label="Color de vista previa">
                  {tintSwatches.map((swatch) => (
                    <button
                      key={swatch.id}
                      type="button"
                      className="workbench-swatch"
                      aria-label={swatch.label}
                      aria-pressed={tint === swatch.color}
                      style={{ "--swatch": swatch.color } as CSSProperties}
                      onClick={() => motion.setIconColor(swatch.color)}
                    />
                  ))}
                </div>

                <div className="workbench-segmented" role="group" aria-label="Variante de trazo">
                  <button type="button" aria-pressed={!filled} onClick={() => setFilled(false)}>Contorno</button>
                  <button type="button" aria-pressed={filled} onClick={() => setFilled(true)}>Sólido</button>
                </div>

                <div className="workbench-segmented workbench-segmented--scales" role="group" aria-label="Escala de icono">
                  {previewScales.map((itemScale) => (
                    <button
                      key={itemScale}
                      type="button"
                      aria-pressed={scale === itemScale}
                      onClick={() => setScale(itemScale)}
                    >
                      {itemScale}px
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="workbench-guide-toggle"
                  aria-pressed={guides}
                  onClick={() => setGuides((current) => !current)}
                >
                  {scale}×{scale}
                </button>
              </div>
            </div>

            <div className="workbench-body" style={{ "--live-tint": tint } as CSSProperties}>
              <div className="workbench-grid-pane" data-scroll-mobile="item">
                <div className="workbench-grid" role="group" aria-label="Muestras de iconos Forma">
                  {visibleIcons.length > 0 ? (
                    visibleIcons.map((item, idx) => {
                      const itemDrawing = filled && item.filled ? item.filled : item;
                      const isSelected = item.id === active.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className="workbench-icon-tile"
                          aria-pressed={isSelected}
                          style={{ "--stagger": idx } as CSSProperties}
                          onClick={() => setSelectedId(item.id)}
                        >
                          <span className="workbench-tile-stage">
                            <IconArtwork src={itemDrawing.src} size={scale} />
                          </span>
                          <span className="workbench-tile-label">{item.label}</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="workbench-empty">
                      <button type="button" className="launch-secondary-cta" onClick={() => setFilter("")}>
                        Restablecer filtro
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <aside className="workbench-inspector" data-scroll-mobile="item" aria-label="Inspector del icono seleccionado">
                <div className="workbench-inspector-head">
                  <div>
                    <span className="workbench-inspector-category">{active.groupLabel}</span>
                    <h2>{active.label}</h2>
                  </div>
                  <span className="workbench-revision-badge">{filled && active.filled ? "Sólido" : "Contorno"} · r{drawing.revision}</span>
                </div>

                <div className="workbench-stage-well" data-guides={guides}>
                  {guides && (
                    <svg className="workbench-ruler-bg" viewBox="0 0 96 96" fill="none" aria-hidden="true">
                      <path d="M48 0v96M0 48h96" className="ruler-axis" />
                      <path d="M0 0l96 96M96 0 0 96" className="ruler-diag" />
                      <rect x="0.5" y="0.5" width="95" height="95" rx="2" className="ruler-frame" data-active={scale === 32} />
                      <rect x="12" y="12" width="72" height="72" rx="1.5" className="ruler-frame" data-active={scale === 24} />
                      <rect x="18" y="18" width="60" height="60" rx="1" className="ruler-frame" data-active={scale === 20} />
                      <rect x="24" y="24" width="48" height="48" rx="1" className="ruler-frame" data-active={scale === 16} />
                    </svg>
                  )}
                  <span className="workbench-live-ink">
                    <IconArtwork src={drawing.src} size={scale * 3} label={active.label} />
                  </span>
                  <div className="workbench-well-hud" aria-hidden="true">
                    <span>{scale} × {scale} px</span>
                    <span>{active.slug}</span>
                  </div>
                </div>

                <div className="workbench-scale-strip" aria-label="Comparación en cuatro escalas">
                  {previewScales.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className="workbench-scale-cell"
                      aria-pressed={scale === s}
                      onClick={() => setScale(s)}
                    >
                      <span className="workbench-scale-icon">
                        <IconArtwork src={drawing.src} size={s} />
                      </span>
                      <small>{s}px</small>
                    </button>
                  ))}
                </div>

                <div className="workbench-code-box">
                  <code aria-label={importStatement}>
                    <span className="tok-kw">import</span>{" "}
                    <span className="tok-punct">{"{"}</span>{" "}
                    <span className="tok-id">{importName}</span>{" "}
                    <span className="tok-punct">{"}"}</span>{" "}
                    <span className="tok-kw">from</span>{" "}
                    <span className="tok-str">&quot;@grausvera/unancha/icons&quot;</span>
                    <span className="tok-punct">;</span>
                  </code>
                  <button
                    type="button"
                    onClick={() => copySnippet(importStatement, "import")}
                    aria-label="Copiar importación React"
                  >
                    {copiedKey === "import" ? <Check /> : <Copy />}
                  </button>
                </div>

                <div className="workbench-inspector-actions">
                  <button
                    type="button"
                    className="launch-cta workbench-download-btn"
                    onClick={() => void downloadColoredSvg(drawing.src, drawing.downloadName, tint, scale)}
                  >
                    <Download /> SVG
                  </button>
                  <Link className="launch-secondary-cta workbench-detail-btn" href={drawing.href}>
                    Ficha
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <div className="forma-marquee-bar" data-scroll-fx="true">
        <div className="tape-window" aria-hidden="true">
          <div className="tape-track">
            {[0, 1].map((copy) => (
              <div className="tape-run" key={copy}>
                {marqueeTop.map((icon) => (
                  <Link key={`${copy}-${icon.id}`} href={icon.href} className="marquee-chip" tabIndex={-1}>
                    <IconArtwork src={icon.src} size={22} />
                    <strong>{icon.label}</strong>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="tape-track tape-track--reverse">
            {[0, 1].map((copy) => (
              <div className="tape-run" key={copy}>
                {marqueeBottom.map((icon) => (
                  <Link key={`${copy}-${icon.id}`} href={icon.href} className="marquee-chip" tabIndex={-1}>
                    <IconArtwork src={icon.filled?.src ?? icon.src} size={22} />
                    <strong>{icon.label}</strong>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
        {!motion.reduced && (
          <button
            type="button"
            className="motion-switch"
            onClick={motion.toggle}
            aria-label={motion.paused ? "Reanudar animaciones" : "Pausar animaciones"}
            title={motion.paused ? "Reanudar animaciones" : "Pausar animaciones"}
          >
            {motion.paused ? <Play /> : <Pause />}
          </button>
        )}
      </div>
    </section>
  );
}
