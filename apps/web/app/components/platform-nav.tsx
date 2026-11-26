"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, BookOpen, Compass, Menu, PenTool, X } from "@grausvera/unancha/icons";

const sections = [
  { href: "/explorer", label: "Explorador", Icon: Compass },
  { href: "/studio", label: "Estudio", Icon: PenTool },
  { href: "/docs", label: "Documentación", Icon: BookOpen },
] as const;

/** Señala el área actual también al navegar por las fichas del Explorador. */
export function PlatformNav() {
  const path = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const menuOpen = openPath === path;
  const menuButton = useRef<HTMLButtonElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const area = "/" + path.split("/")[1];
  const action = area === "/studio" ? { href: "/explorer", label: "Ver iconos" } : { href: "/studio", label: "Abrir Estudio" };

  useLayoutEffect(() => {
    const header = controlsRef.current?.closest("header");
    if (!header) {
      return;
    }

    const root = document.documentElement;

    /** Comparte la altura de la cabecera con las barras y vistas previas fijas. */
    const updateHeaderHeight = () => {
      root.style.setProperty("--site-header-height", `${header.offsetHeight}px`);
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);

    return () => {
      observer.disconnect();
      root.style.removeProperty("--site-header-height");
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    /** Cierra el menú al pulsar fuera o devuelve el foco al botón con Escape. */
    function dismiss(event: PointerEvent | KeyboardEvent) {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") {
          setOpenPath(null);
          menuButton.current?.focus();
        }
      } else if (event.target instanceof Node && !controlsRef.current?.contains(event.target)) {
        setOpenPath(null);
      }
    }

    /** Restablece el menú al pasar entre navegación compacta y de escritorio. */
    const resetMenu = () => setOpenPath(null);

    const compact = window.matchMedia("(max-width: 43rem)");
    compact.addEventListener("change", resetMenu);
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", dismiss);

    return () => {
      compact.removeEventListener("change", resetMenu);
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", dismiss);
    };
  }, [menuOpen]);

  return (
    <div className="header-controls" ref={controlsRef}>
      <button
        ref={menuButton}
        className="platform-menu-trigger"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="platform-menu"
        onClick={() => setOpenPath(menuOpen ? null : path)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        <span>Menú</span>
      </button>
      <div id="platform-menu" className="platform-menu" data-open={menuOpen}>
        <nav className="platform-nav" aria-label="Navegación principal">
          {sections.map(({ href, label, Icon }) => (
            <Link key={href} href={href} onClick={() => setOpenPath(null)} aria-current={area === href ? "location" : undefined}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="header-secondary-link" href="/explorer" onClick={() => setOpenPath(null)}>
            341 iconos
          </Link>
          <Link className="header-cta" href={action.href} aria-label={action.label} onClick={() => setOpenPath(null)}>
            <span>{action.label}</span>
            <ArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}
