import type { KeyboardEvent } from "react";

/** Permite recorrer y activar pestañas horizontales con flechas, Inicio y Fin. */
export function navigateTabs(event: KeyboardEvent<HTMLElement>) {
  const { key, target, currentTarget } = event;
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key) || !(target instanceof HTMLButtonElement)) {
    return;
  }

  const tabs = Array.from(currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
  const current = tabs.indexOf(target);
  if (current < 0) {
    return;
  }

  let next = current;
  if (key === "Home") {
    next = 0;
  } else if (key === "End") {
    next = tabs.length - 1;
  } else {
    next = (current + (key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  }

  event.preventDefault();
  tabs[next].focus();
  tabs[next].click();
}
