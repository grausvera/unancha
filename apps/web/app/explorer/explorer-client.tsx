"use client";

import { useSearchParams } from "next/navigation";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from "react";
import {
  ChevronDown,
  Filter,
  Search,
  X,
} from "@grausvera/unancha/icons";
import { ColorPickerControls } from "../components/color-picker-controls";
import { hexToHsv } from "../lib/color";
import { normalizeSearch } from "../lib/normalize-search";
import { getExplorerVariant, type ExplorerGroup, type ExplorerItem } from "./catalogue";
import { ExplorerGrid } from "./explorer-grid";
import { ExplorerInspector } from "./explorer-inspector";

/** Alinea un elemento debajo de la barra cuando esta alcanza su posición fija. */
function scrollBelowDock(dock: HTMLElement, target: HTMLElement) {
  const dockTop = Number.parseFloat(getComputedStyle(dock).top);
  const offset = dockTop + dock.offsetHeight + 12;
  window.scrollBy({ top: target.getBoundingClientRect().top - offset, behavior: "instant" });
}

/** Catálogo interactivo de iconos Forma con controles globales independientes del inspector lateral. */
export function ExplorerClient({
  items,
  groups,
  initialQuery,
  initialGroup,
  initialSelectedId,
}: {
  items: ExplorerItem[];
  groups: ExplorerGroup[];
  initialQuery: string;
  initialGroup: string;
  initialSelectedId: string;
}) {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [activeGroup, setActiveGroup] = useState(initialGroup);
  const [filled, setFilled] = useState(false);
  const filledRef = useRef(false);
  const [scale, setScale] = useState<number>(24);
  const [tint, setTint] = useState<string>("#868690");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<"color" | "group" | null>(null);
  const [galleryHsv, setGalleryHsv] = useState<[number, number, number]>(() =>
    hexToHsv("#868690"),
  );
  const pageRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const optionsButtonRef = useRef<HTMLButtonElement>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);
  const galleryColorRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState(initialSelectedId);
  const inspectorRef = useRef<HTMLElement>(null);
  const selectedTrigger = useRef<HTMLButtonElement>(null);
  const focusInspector = useRef(false);
  const [copiedKey, setCopiedKey] = useState("");
  const [visibleCount, setVisibleCount] = useState(60);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const previousFilters = useRef({ query: initialQuery, group: initialGroup });

  // Lee la URL vigente al volver por el historial o seguir un enlace con filtros.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.pathname !== "/explorer") {
      return;
    }

    const group = url.searchParams.get("group");
    setQuery(url.searchParams.get("q") ?? "");
    setActiveGroup(group && groups.some(({ id }) => id === group) ? group : "");
  }, [groups, searchParams]);

  useLayoutEffect(() => {
    const page = pageRef.current;
    const dock = dockRef.current;
    if (!page || !dock) {
      return;
    }

    /** Ajusta el espacio del inspector y los menús cuando cambia la altura de la barra. */
    const updateDockHeight = () => {
      page.style.setProperty("--explorer-dock-height", `${dock.offsetHeight}px`);
    };
    updateDockHeight();
    const observer = new ResizeObserver(updateDockHeight);
    observer.observe(dock);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const compactDock = window.matchMedia("(max-width: 75rem)");

    /** Restablece el panel cuando sus controles pasan de desplegables a visibles. */
    function closeOnLayoutChange() {
      setOptionsOpen(false);
      setOpenMenu(null);
    }

    compactDock.addEventListener("change", closeOnLayoutChange);

    return () => compactDock.removeEventListener("change", closeOnLayoutChange);
  }, []);

  useEffect(() => {
    if (!optionsOpen && !openMenu) {
      return;
    }

    const menu = openMenu === "group" ? groupMenuRef.current : galleryColorRef.current;

    /** Cierra los paneles cuando el usuario selecciona un control fuera de ellos. */
    function onPointerDown(event: PointerEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (optionsOpen && !optionsRef.current?.contains(event.target) && !optionsButtonRef.current?.contains(event.target)) {
        setOptionsOpen(false);
        setOpenMenu(null);
      } else if (openMenu && !menu?.contains(event.target)) {
        setOpenMenu(null);
      }
    }

    /** Escape cierra primero el menú más interno y devuelve el foco a su botón. */
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) {
        return;
      }

      event.preventDefault();

      if (openMenu) {
        menu?.querySelector("button")?.focus({ preventScroll: true });
        setOpenMenu(null);
      } else {
        optionsButtonRef.current?.focus({ preventScroll: true });
        setOptionsOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openMenu, optionsOpen]);

  const deferredQuery = useDeferredValue(query);
  const searchIndex = useMemo(() => items.map((item) => ({
    item,
    text: normalizeSearch([item.label, item.slug, item.groupLabel, ...item.keywords].join(" ")),
  })), [items]);
  const filtered = useMemo(() => {
    const terms = normalizeSearch(deferredQuery).split(/\s+/).filter(Boolean);

    return searchIndex
      .filter(({ item, text }) =>
        (!activeGroup || item.group === activeGroup) && terms.every((term) => text.includes(term)),
      )
      .map(({ item }) => item);
  }, [searchIndex, deferredQuery, activeGroup]);

  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  useEffect(() => {
    setVisibleCount(60);
  }, [deferredQuery, activeGroup]);

  useLayoutEffect(() => {
    const previous = previousFilters.current;
    if (previous.query === deferredQuery && previous.group === activeGroup) {
      return;
    }

    previousFilters.current = { query: deferredQuery, group: activeGroup };

    const results = resultsRef.current;
    const dock = dockRef.current;
    if (results && dock) {
      const resultsTop = results.getBoundingClientRect().top;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      if (resultsTop < dock.getBoundingClientRect().bottom || resultsTop >= viewportHeight) {
        scrollBelowDock(dock, results);
      }
    }
  }, [deferredQuery, activeGroup]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= filtered.length) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((current) => Math.min(filtered.length, current + 60));
        }
      },
      { rootMargin: "320px" },
    );
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId],
  );

  /** Copia un texto al portapapeles y muestra confirmación breve (referencia estable para las tarjetas). */
  const copyText = useCallback(async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(
        () => setCopiedKey((current) => (current === key ? "" : current)),
        1800,
      );
    } catch {
      setCopiedKey("");
    }
  }, []);

  useLayoutEffect(() => {
    if (selectedId && focusInspector.current) {
      focusInspector.current = false;
      const frame = requestAnimationFrame(() => {
        const inspector = inspectorRef.current;
        const dock = dockRef.current;
        if (inspector && dock && getComputedStyle(inspector).position !== "sticky") {
          inspector.focus({ preventScroll: true });
          scrollBelowDock(dock, inspector);
        }
      });

      return () => cancelAnimationFrame(frame);
    }
  }, [selectedId]);

  /** Acerca la vista previa al usuario cuando el inspector se apila sobre la cuadrícula. */
  const toggleSelected = useCallback((id: string, trigger: HTMLButtonElement) => {
    const opening = trigger.getAttribute("aria-pressed") !== "true";
    selectedTrigger.current = opening ? trigger : null;
    focusInspector.current = opening;
    setSelectedId(opening ? id : "");
  }, []);

  /** Devuelve el foco a la tarjeta después de cerrar el inspector. */
  const closeInspector = useCallback(() => {
    const trigger = selectedTrigger.current;
    selectedTrigger.current = null;
    setSelectedId("");
    requestAnimationFrame(() => {
      if (!trigger?.isConnected) {
        searchRef.current?.focus({ preventScroll: true });

        return;
      }

      trigger.focus({ preventScroll: true });
      const dock = dockRef.current;
      const bounds = trigger.getBoundingClientRect();
      if (dock && (bounds.top < dock.getBoundingClientRect().bottom || bounds.bottom > window.innerHeight)) {
        scrollBelowDock(dock, trigger);
      }
    });
  }, []);

  /** Mantiene el objetivo de teclado visible aunque las dos barras estén fijas. */
  function revealFocusedResult(event: FocusEvent<HTMLDivElement>) {
    const dock = dockRef.current;
    const focused = event.target;
    const inspector = inspectorRef.current;
    if (
      dock && focused.matches(":focus-visible")
      && focused.getBoundingClientRect().top < dock.getBoundingClientRect().bottom
      && (!inspector?.contains(focused) || getComputedStyle(inspector).position !== "sticky")
    ) {
      scrollBelowDock(dock, focused);
    }
  }

  /** Retira los menús al salir de la barra con el teclado. */
  function closeDockWhenFocusLeaves(event: FocusEvent<HTMLElement>) {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) {
      setOptionsOpen(false);
      setOpenMenu(null);
    }
  }

  /** Actualiza los filtros visibles y su URL sin recargar la galería ni añadir pasos al historial. */
  function updateFilters(filters: { query?: string; group?: string }) {
    const url = new URL(window.location.href);
    const { query: nextQuery, group: nextGroup } = filters;

    if (nextQuery !== undefined) {
      setQuery(nextQuery);
      if (nextQuery) {
        url.searchParams.set("q", nextQuery);
      } else {
        url.searchParams.delete("q");
      }
    }

    if (nextGroup !== undefined) {
      setActiveGroup(nextGroup);
      if (nextGroup) {
        url.searchParams.set("group", nextGroup);
      } else {
        url.searchParams.delete("group");
      }
    }

    if (url.href !== window.location.href) {
      window.history.replaceState(null, "", url);
    }
  }

  /** Aplica una categoría y devuelve el foco al control que queda visible. */
  function selectGroup(group: string) {
    updateFilters({ group });
    setOpenMenu(null);

    if (optionsOpen) {
      setOptionsOpen(false);
      optionsButtonRef.current?.focus({ preventScroll: true });
    } else {
      groupMenuRef.current?.querySelector("button")?.focus({ preventScroll: true });
    }
  }

  /** Actualiza el estilo de la galería y la variante utilizada por la copia rápida. */
  function changeFilled(next: boolean) {
    filledRef.current = next;
    setFilled(next);
  }

  /** Resuelve el componente al pulsar copiar, con la variante activa en ese momento. */
  const copyCard = useCallback((item: ExplorerItem) => {
    const variant = getExplorerVariant(item, filledRef.current);
    const snippet = variant?.componentName
      ? `<${variant.componentName} />`
      : item.slug;

    void copyText(snippet, `card:${item.id}`);
  }, [copyText]);

  const galleryPickerOpen = openMenu === "color";
  const groupMenuOpen = openMenu === "group";
  const hasCustomSettings = Boolean(query || activeGroup || filled || scale !== 24 || tint !== "#868690");

  return (
    <main
      id="content"
      tabIndex={-1}
      ref={pageRef}
      className="catalogue-page"
      style={{ "--explorer-tint": tint } as CSSProperties}
    >
      <h1 id="biblioteca" className="explorer-heading">Explorador de iconos Forma</h1>
      <section
        ref={dockRef}
        className="explorer-control-dock"
        aria-label="Búsqueda y controles de galería"
        onBlur={closeDockWhenFocusLeaves}
      >
        <div className="explorer-search-box">
          <Search />
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder="Buscar…"
            name="q"
            autoComplete="off"
            aria-label="Buscar iconos en la biblioteca"
            onChange={(event) => updateFilters({ query: event.currentTarget.value })}
          />
          {query && (
            <button
              type="button"
              className="explorer-search-clear"
              aria-label="Limpiar búsqueda"
              onClick={() => updateFilters({ query: "" })}
            >
              <X />
            </button>
          )}
        </div>

        <button
          ref={optionsButtonRef}
          type="button"
          className="explorer-options-trigger"
          aria-expanded={optionsOpen}
          aria-controls="explorer-options"
          onClick={() => {
            searchRef.current?.blur();
            setOptionsOpen(!optionsOpen);
            setOpenMenu(null);
          }}
        >
          <Filter aria-hidden="true" />
          Ajustes
        </button>

        <div
          className="explorer-segmented explorer-dock-variants"
          role="group"
          aria-label="Variante de trazo en galería"
        >
          <button type="button" aria-pressed={!filled} onClick={() => changeFilled(false)}>
            Contorno
          </button>
          <button type="button" aria-pressed={filled} onClick={() => changeFilled(true)}>
            Sólido
          </button>
        </div>

        <div
          ref={optionsRef}
          id="explorer-options"
          className="explorer-dock-options"
          data-open={optionsOpen}
          role="group"
          aria-label="Ajustes de galería"
        >
          <label
            className="explorer-dock-slider"
            aria-label="Tamaño de iconos en galería"
          >
            <span>Tamaño</span>
            <input
              type="range"
              min={12}
              max={48}
              step={1}
              value={scale}
              onChange={(event) => setScale(event.currentTarget.valueAsNumber)}
            />
            <output>{scale}px</output>
          </label>

          <div className="explorer-dock-color-wrap" ref={galleryColorRef}>
            <button
              type="button"
              className="explorer-dock-color-trigger"
              aria-label="Elegir color de iconos"
              aria-expanded={galleryPickerOpen}
              title="Color de iconos"
              onClick={() => setOpenMenu(galleryPickerOpen ? null : "color")}
            >
              <span className="explorer-custom-wheel" aria-hidden="true" />
              <span className="explorer-dock-color-label">Color</span>
            </button>
            {galleryPickerOpen && (
              <div
                className="explorer-dock-popover"
                role="dialog"
                aria-label="Color de galería"
              >
                <ColorPickerControls
                  hsv={galleryHsv}
                  compact
                  hueLabel="Matiz de galería"
                  onChange={(next, hex) => {
                    setGalleryHsv(next);
                    setTint(hex);
                  }}
                />
              </div>
            )}
          </div>
          <div className="explorer-group-dropdown" ref={groupMenuRef}>
            <button
              type="button"
              className="explorer-group-trigger"
              aria-expanded={groupMenuOpen}
              onClick={() => setOpenMenu(groupMenuOpen ? null : "group")}
            >
              <span>
                {activeGroup
                  ? (groups.find((g) => g.id === activeGroup)?.label ?? "Categoría")
                  : "Todas las categorías"}
              </span>
              <ChevronDown />
            </button>
            {groupMenuOpen && (
              <div className="explorer-group-popover" role="group" aria-label="Categorías de iconos">
                <button
                  type="button"
                  className="explorer-group-option"
                  aria-pressed={activeGroup === ""}
                  onClick={() => selectGroup("")}
                >
                  <span>Todas</span>
                  <small>{items.length}</small>
                </button>
                {groups.map((group) => (
                  <button
                    key={group.id}
                    type="button"
                    className="explorer-group-option"
                    aria-pressed={activeGroup === group.id}
                    onClick={() => selectGroup(group.id)}
                  >
                    <span>{group.label}</span>
                    <small>{group.count}</small>
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasCustomSettings && (
            <button
              type="button"
              className="explorer-reset-btn"
              onClick={() => {
                updateFilters({ query: "", group: "" });
                changeFilled(false);
                setScale(24);
                setTint("#868690");
                setGalleryHsv(hexToHsv("#868690"));
                setOptionsOpen(false);
                setOpenMenu(null);
                (optionsOpen ? optionsButtonRef.current : searchRef.current)?.focus({ preventScroll: true });
              }}
            >
              Restablecer
            </button>
          )}
        </div>

        <div className="explorer-result-meta" role="status">
          <strong>{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "icono" : "iconos"}
        </div>
      </section>

      <div
        className="catalogue-body"
        data-inspecting={Boolean(selected?.line || selected?.filled)}
        onFocusCapture={revealFocusedResult}
      >
        <div ref={resultsRef} className="catalogue-results">
          {filtered.length > 0 ? (
            <div
              style={{ "--explorer-scale": (scale + 8) / 56 } as CSSProperties}
            >
              <ExplorerGrid
                items={visibleItems}
                filled={filled}
                selectedId={selectedId}
                copiedKey={copiedKey}
                onSelect={toggleSelected}
                onCopy={copyCard}
              />
              {visibleCount < filtered.length && (
                <div ref={loadMoreRef} className="explorer-load-more" aria-hidden="true" />
              )}
            </div>
          ) : (
            <div className="explorer-empty">
              <p>No encontramos iconos para &ldquo;{query}&rdquo;.</p>
              <button
                type="button"
                className="secondary-action"
                onClick={() => updateFilters({ query: "", group: "" })}
              >
                Mostrar los {items.length} iconos
              </button>
            </div>
          )}
        </div>

        <ExplorerInspector
          selected={selected}
          panelRef={inspectorRef}
          copiedKey={copiedKey}
          setCopiedKey={setCopiedKey}
          copyText={copyText}
          onClose={closeInspector}
        />
      </div>
    </main>
  );
}
