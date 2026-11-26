"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowRight, Check, ChevronDown } from "@grausvera/unancha/icons";
import { ScrollHeading } from "./motion";
import type { CategoryShowcaseGroup } from "./selection";
import { IconArtwork } from "../components/icon-artwork";

/** Muestra las categorías de iconos Forma en una vitrina monocromática con cascada por scroll. */
export function FormaCover({
  categories,
  categoryCount,
}: {
  categories: CategoryShowcaseGroup[];
  count: number;
  categoryCount: number;
}) {
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const [filled, setFilled] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoryBar = useRef<HTMLDivElement>(null);
  const categoryTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!categoriesOpen) {
      return;
    }

    /** Cierra el selector al salir de él y devuelve el foco al pulsar Escape. */
    function dismiss(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent && event.key === "Escape") {
        setCategoriesOpen(false);
        categoryTrigger.current?.focus();
      } else if (event.type === "pointerdown" && event.target instanceof Node && !categoryBar.current?.contains(event.target)) {
        setCategoriesOpen(false);
      }
    }

    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);

    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, [categoriesOpen]);

  const currentGroup = categories.find((group) => group.id === activeId) ?? categories[0];
  if (!currentGroup) {
    return null;
  }

  return (
    <section id="categories" className="categories-section" data-scroll-mobile="group" aria-labelledby="forma-title" data-reveal="true" data-scroll-fx="true">
      <div className="section-container">
        <header className="section-header-compact" data-scroll-fx="true">
          <div>
            <span className="section-kicker">{categoryCount} categorías</span>
            <ScrollHeading id="forma-title" text="Explora por categoría." />
          </div>
          <div className="ink-choices" role="group" aria-label="Variante de trazo de la categoría">
            <button type="button" aria-pressed={!filled} onClick={() => setFilled(false)}>Contorno</button>
            <button type="button" aria-pressed={filled} onClick={() => setFilled(true)}>Sólido</button>
          </div>
        </header>

        <div ref={categoryBar} className="category-tabs-bar" data-scroll-fx="true">
          <button
            ref={categoryTrigger}
            type="button"
            className="category-select-trigger"
            aria-expanded={categoriesOpen}
            aria-controls="home-category-options"
            onClick={() => setCategoriesOpen(!categoriesOpen)}
          >
            <span>{currentGroup.label}</span>
            <small>{currentGroup.count}</small>
            <ChevronDown aria-hidden="true" />
          </button>
          <div
            id="home-category-options"
            className="category-tab-list"
            data-open={categoriesOpen}
            role="group"
            aria-label="Categorías destacadas de iconos"
          >
            {categories.map((group) => {
              const selected = group.id === currentGroup.id;

              return (
                <button
                  key={group.id}
                  type="button"
                  aria-pressed={selected}
                  className="category-tab-btn"
                  onClick={() => {
                    setActiveId(group.id);

                    if (categoriesOpen) {
                      setCategoriesOpen(false);
                      categoryTrigger.current?.focus({ preventScroll: true });
                    }
                  }}
                >
                  <span>{group.label}</span>
                  <small>{group.count}</small>
                  <Check className="category-option-check" aria-hidden="true" />
                </button>
              );
            })}
          </div>
          <Link className="launch-link" href={`/explorer?group=${currentGroup.id}`}>
            Ver los {currentGroup.count} <ArrowRight />
          </Link>
        </div>

        <div className="category-showcase-panel" data-scroll-fx="true">
          <div key={currentGroup.id} className="category-icon-grid">
            {currentGroup.items.map((icon, idx) => {
              const drawing = filled && icon.filled ? icon.filled : icon;

              return (
                <Link
                  key={icon.id}
                  href={drawing.href}
                  prefetch={false}
                  className="category-icon-card"
                  style={{ "--stagger": idx } as CSSProperties}
                >
                  <div className="category-card-top">
                    <span className="category-card-variant">{filled && icon.filled ? "Sólido" : "Contorno"}</span>
                    <ArrowRight className="category-card-arrow" />
                  </div>
                  <div className="category-card-art">
                    <IconArtwork src={drawing.src} size={38} />
                  </div>
                  <div className="category-card-meta">
                    <strong>{icon.label}</strong>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
