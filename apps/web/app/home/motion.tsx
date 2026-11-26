"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { observePageScroll } from "./scroll-motion";

type Motion = {
  enabled: boolean;
  reduced: boolean;
  paused: boolean;
  toggle: () => void;
  iconColor: string;
  setIconColor: (color: string) => void;
};
const MotionContext = createContext<Motion>({
  enabled: false,
  reduced: true,
  paused: false,
  toggle: () => {},
  iconColor: "#f5f5f7",
  setIconColor: () => {},
});

/** Coordina los efectos de la portada con el desplazamiento nativo y las preferencias de movimiento. */
export function MotionPage({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [reduced, setReduced] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [paused, setPaused] = useState(false);
  const [iconColor, setIconColor] = useState("#f5f5f7");
  const pageRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");

    /** Relee las preferencias cuando cambia el sistema o se regresa a la pestaña. */
    function synchronize() {
      setReduced(preference.matches);
      setHidden(document.hidden);
    }

    synchronize();
    setReady(true);
    preference.addEventListener("change", synchronize);
    document.addEventListener("visibilitychange", synchronize);

    return () => {
      preference.removeEventListener("change", synchronize);
      document.removeEventListener("visibilitychange", synchronize);
    };
  }, []);

  const enabled = ready && !reduced && !hidden && !paused;
  useLayoutEffect(() => observePageScroll(pageRef, enabled), [enabled]);

  return (
    <MotionContext.Provider
      value={{
        enabled,
        reduced,
        paused,
        toggle: () => setPaused((previous) => !previous),
        iconColor,
        setIconColor,
      }}
    >
      <main
        id="content"
        tabIndex={-1}
        ref={pageRef}
        className="launch-page"
        data-motion={!ready ? "initial" : enabled ? "on" : "off"}
        style={{ "--global-icon-color": iconColor } as CSSProperties}
      >
        {children}
      </main>
    </MotionContext.Provider>
  );
}

/** Renderiza un titular palabra por palabra que aparece progresivamente al desplazarse arriba o abajo. */
export function ScrollHeading({
  text,
  id,
  as = "h2",
  className,
}: {
  text: string;
  id?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  const words = text.trim().split(/\s+/);
  const Tag = as;

  return (
    <Tag id={id} className={`scroll-heading${className ? ` ${className}` : ""}`} data-scroll-text="true">
      {words.map((word, idx) => {
        const start = (idx / Math.max(1, words.length)) * 0.55;

        return (
          <span key={`${word}-${idx}`}>
            <span
              className="scroll-word"
              style={{ "--w-start": start.toFixed(3) } as CSSProperties}
            >
              {word}
            </span>
            {idx < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </Tag>
  );
}

/** Comparte la preferencia de movimiento entre el workbench y las muestras de iconos Forma. */
export function useMotion() {
  return useContext(MotionContext);
}

/** Activa únicamente las escenas que han entrado en la ventana del navegador. */
export function useInView(ref: RefObject<HTMLElement | null>) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.12 });
    observer.observe(target);

    return () => observer.disconnect();
  }, [ref]);

  return visible;
}
