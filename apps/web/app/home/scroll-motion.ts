import type { RefObject } from "react";

const scrollEffectMargin = 240;

/** Instala la observación, los efectos de desplazamiento y sus funciones de limpieza. */
export function observePageScroll(pageRef: RefObject<HTMLElement | null>, enabled: boolean) {
  const container = pageRef.current;
  if (!container) {
    return;
  }

  const revealTargets = Array.from(container.querySelectorAll<HTMLElement>("[data-reveal]"));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && entry.target instanceof HTMLElement) {
          entry.target.dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08 },
  );

  for (const target of revealTargets) {
    observer.observe(target);
  }

  if (!enabled) {
    return () => observer.disconnect();
  }

  let frame = 0;
  let wheelFrame = 0;
  let wheelTarget = window.scrollY;
  let wheelPosition = window.scrollY;
  let lastWheelTime = 0;
  const compactViewport = window.matchMedia("(max-width: 62rem), (max-height: 35rem), (pointer: coarse)");
  const wheelViewport = window.matchMedia("(pointer: fine)");
  const visualViewport = window.visualViewport;
  const header = document.querySelector(".site-header");
  const scrollElements = container.querySelectorAll<HTMLElement>("[data-scroll-fx], [data-scroll-text], [data-scroll-mobile='item']");
  const nearby = new Set<HTMLElement>();
  const lastStyles = new WeakMap<HTMLElement, string>();
  const scrollObserver = new IntersectionObserver((entries) => {
    for (const { target, isIntersecting } of entries) {
      const element = target as HTMLElement;

      if (isIntersecting) {
        nearby.add(element);
      } else {
        nearby.delete(element);
      }
    }

    schedulePaint();
  }, { rootMargin: `${scrollEffectMargin}px` });

  for (const element of scrollElements) {
    scrollObserver.observe(element);
  }

  /** Mide los bordes visibles en pantallas compactas y conserva la profundidad en escritorio. */
  function paintScroll() {
    frame = 0;
    const compact = compactViewport.matches;
    const viewportTop = compact ? (visualViewport?.offsetTop ?? 0) : 0;
    const viewportHeight = Math.max(1, compact ? (visualViewport?.height ?? window.innerHeight) : window.innerHeight);
    const viewportBottom = viewportTop + viewportHeight;
    const readingTop = compact ? Math.max(viewportTop, header?.getBoundingClientRect().bottom ?? 0) : viewportTop;
    const viewportCenter = viewportTop + viewportHeight * 0.5;
    const remainingScroll = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    const bottomLock = 1 - Math.min(1, Math.max(0, remainingScroll) / 80);
    const topLock = 1 - Math.min(1, Math.max(0, window.scrollY) / 40);
    const updates: Array<{ el: HTMLElement; focus: number; dir: number }> = [];

    // Primero se leen todas las medidas y después se escriben los estilos para evitar recálculos de layout repetidos.
    for (const el of nearby) {
      if (compact ? el.dataset.scrollMobile === "group" : el.dataset.scrollMobile === "item") {
        continue;
      }

      const rect = el.getBoundingClientRect();
      const outside = Math.max(readingTop - rect.bottom, rect.top - viewportBottom, 0);
      if (outside > scrollEffectMargin) {
        continue;
      }

      const elCenter = rect.top + rect.height * 0.5;
      const dir = elCenter >= viewportCenter ? 1 : -1;

      if (compact) {
        // Mantiene legible cualquier bloque que alcance la zona central, incluso si es muy alto.
        const readingHeight = Math.max(1, viewportBottom - readingTop);
        const edgeBand = readingHeight * .29;
        const distance = Math.max(readingTop + edgeBand - rect.bottom, rect.top - (viewportBottom - edgeBand), 0);
        const edgeFocus = 1 - Math.min(1, distance / (edgeBand + 48));
        const boundaryLock = outside === 0 ? Math.max(topLock, bottomLock) : 0;
        const focus = Math.max(edgeFocus, boundaryLock);
        updates.push({ el, focus, dir });
        continue;
      }

      const dist = Math.abs(elCenter - viewportCenter) / (viewportHeight * 0.65);
      const rawFocus = 1 - Math.max(0, Math.min(1, (dist - 0.18) / 0.82));
      const inTopBand = rect.top >= -40 && rect.bottom <= viewportHeight + 40;
      const inBottomBand = elCenter > viewportHeight * 0.45 && rect.top < viewportHeight * 0.94;
      const focus = Math.max(rawFocus, inTopBand ? topLock : 0, inBottomBand ? bottomLock : 0);
      updates.push({ el, focus, dir });
    }

    for (const { el, focus, dir } of updates) {
      const progress = focus.toFixed(3);
      const key = `${progress}:${dir}`;
      if (lastStyles.get(el) !== key) {
        lastStyles.set(el, key);
        el.style.setProperty("--scroll-p", progress);
        el.style.setProperty("--scroll-dir", String(dir));
      }
    }
  }

  /** Agrupa las actualizaciones de visibilidad en un solo fotograma. */
  function schedulePaint() {
    if (!frame) {
      frame = window.requestAnimationFrame(paintScroll);
    }
  }

  /** Acerca el desplazamiento a su destino con una velocidad independiente de la tasa de refresco. */
  function glide(timestamp: number) {
    const elapsed = lastWheelTime ? Math.min(50, timestamp - lastWheelTime) : 16;
    lastWheelTime = timestamp;
    wheelPosition += (wheelTarget - wheelPosition) * (1 - Math.exp(-elapsed / 105));

    if (Math.abs(wheelTarget - wheelPosition) < 1) {
      window.scrollTo({ top: wheelTarget, behavior: "instant" });
      wheelFrame = 0;

      return;
    }

    window.scrollTo({ top: wheelPosition, behavior: "instant" });
    wheelFrame = requestAnimationFrame(glide);
  }

  /** Interrumpe el impulso cuando el usuario toma el control por otra vía. */
  function cancelGlide() {
    cancelAnimationFrame(wheelFrame);
    wheelFrame = 0;
    lastWheelTime = 0;
  }

  /** Suaviza la rueda vertical y deja el desplazamiento local en manos del navegador. */
  function onWheel(event: WheelEvent) {
    if (!wheelViewport.matches || !event.cancelable || event.defaultPrevented
      || event.ctrlKey || event.metaKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY)) {
      cancelGlide();

      return;
    }

    for (let element = event.target instanceof Element ? event.target : null;
      element && element !== container; element = element.parentElement) {
      if (element.matches("input, textarea, select")
        || (element.scrollHeight > element.clientHeight && /^(auto|scroll)$/.test(getComputedStyle(element).overflowY))) {
        cancelGlide();

        return;
      }
    }

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const multiplier = event.deltaMode === 1 ? 24 : event.deltaMode === 2 ? window.innerHeight : 1;
    const start = wheelFrame ? wheelTarget : window.scrollY;
    const next = Math.max(0, Math.min(maxScroll, start + event.deltaY * multiplier * .8));

    event.preventDefault();
    wheelTarget = next;

    if (!wheelFrame) {
      wheelPosition = window.scrollY;
      lastWheelTime = 0;
      wheelFrame = requestAnimationFrame(glide);
    }
  }

  /** Restablece las mediciones al rotar o cambiar entre diseños de pantalla. */
  const synchronizeLayout = () => {
    const layout = compactViewport.matches ? "edges" : "depth";
    if (container.dataset.scrollLayout !== layout) {
      cancelGlide();
      container.dataset.scrollLayout = layout;

      for (const element of scrollElements) {
        element.style.removeProperty("--scroll-p");
        element.style.removeProperty("--scroll-dir");
        lastStyles.delete(element);
      }
    }

    schedulePaint();
  };

  /** Activa la rueda suave también en ventanas estrechas con ratón o trackpad. */
  function synchronizeWheel() {
    cancelGlide();

    if (wheelViewport.matches) {
      pageRef.current?.addEventListener("wheel", onWheel, { passive: false });
    } else {
      pageRef.current?.removeEventListener("wheel", onWheel);
    }
  }

  synchronizeLayout();
  synchronizeWheel();
  wheelViewport.addEventListener("change", synchronizeWheel);

  // Inicializa los bloques cercanos antes de que el observador entregue su primer lote.
  for (const element of scrollElements) {
    nearby.add(element);
  }

  window.cancelAnimationFrame(frame);
  paintScroll();
  compactViewport.addEventListener("change", synchronizeLayout);
  window.addEventListener("pointerdown", cancelGlide, { passive: true });
  window.addEventListener("keydown", cancelGlide);
  window.addEventListener("scroll", schedulePaint, { passive: true });
  window.addEventListener("resize", schedulePaint, { passive: true });
  visualViewport?.addEventListener("scroll", schedulePaint, { passive: true });
  visualViewport?.addEventListener("resize", schedulePaint, { passive: true });

  return () => {
    observer.disconnect();
    window.cancelAnimationFrame(frame);
    scrollObserver.disconnect();
    compactViewport.removeEventListener("change", synchronizeLayout);
    cancelGlide();
    wheelViewport.removeEventListener("change", synchronizeWheel);
    container.removeEventListener("wheel", onWheel);
    window.removeEventListener("pointerdown", cancelGlide);
    window.removeEventListener("keydown", cancelGlide);
    window.removeEventListener("scroll", schedulePaint);
    window.removeEventListener("resize", schedulePaint);
    visualViewport?.removeEventListener("scroll", schedulePaint);
    visualViewport?.removeEventListener("resize", schedulePaint);
    container.removeAttribute("data-scroll-layout");
  };
}
