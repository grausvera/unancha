"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown } from "@grausvera/unancha/icons";
import { FrameworkLabel } from "./framework-label";
import type { DocsFramework } from "./frameworks";

type FrameworkPickerProps = {
  options: readonly DocsFramework[];
  selected: DocsFramework;
  onChoose: (framework: DocsFramework) => void;
};

/** Abre la lista de tecnologías y devuelve el foco al selector al elegir una opción o pulsar Escape. */
export function FrameworkPicker({ options, selected, onChoose }: FrameworkPickerProps) {
  const [open, setOpen] = useState(false);
  const listId = useId();
  const picker = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const selectedOption = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    selectedOption.current?.focus();

    /** Cierra el desplegable al pulsar fuera y deja que el destino reciba el foco. */
    function dismiss(event: PointerEvent) {
      if (event.target instanceof Node && !picker.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);

  /** Cierra la lista y devuelve el foco al botón que la abrió. */
  function close() {
    trigger.current?.focus();
    setOpen(false);
  }

  /** Recorre las opciones con las teclas habituales de un desplegable. */
  function navigateOptions(event: KeyboardEvent<HTMLUListElement>) {
    const { key, target, currentTarget } = event;
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key) || !(target instanceof HTMLButtonElement)) {
      return;
    }

    const buttons = Array.from(currentTarget.querySelectorAll("button"));
    const current = buttons.indexOf(target);
    let next = 0;

    if (key === "End") {
      next = buttons.length - 1;
    } else if (key !== "Home") {
      const offset = key === "ArrowDown" ? 1 : -1;
      next = (current + offset + buttons.length) % buttons.length;
    }

    event.preventDefault();
    buttons[next]?.focus();
  }

  return (
    <div className="docs-playground-framework" ref={picker}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}>
      <span className="docs-framework-label" aria-hidden="true">Tecnología</span>
      <button type="button" className="docs-framework-trigger" ref={trigger} aria-expanded={open}
        aria-label={`Tecnología: ${selected.label}`} aria-controls={listId}
        onClick={() => setOpen((current) => !current)}>
        <FrameworkLabel id={selected.id} label={selected.label} />
        <ChevronDown />
      </button>
      <ul className="docs-framework-options" id={listId} aria-label="Tecnologías disponibles" hidden={!open}
        onKeyDown={navigateOptions}>
        {options.map((framework) => (
          <li key={framework.id}>
            <button type="button" aria-pressed={framework.id === selected.id} ref={framework.id === selected.id ? selectedOption : undefined}
              onClick={() => {
                onChoose(framework);
                close();
              }}>
              <FrameworkLabel id={framework.id} label={framework.label} />
              {framework.id === selected.id && <Check />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
