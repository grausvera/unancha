import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, Copy } from "@grausvera/unancha/icons";
import { getExplorerVariant, type ExplorerItem } from "./catalogue";

type CardActions = {
  onSelect: (id: string, trigger: HTMLButtonElement) => void;
  onCopy: (item: ExplorerItem) => void;
};

type ExplorerCardProps = CardActions & {
  item: ExplorerItem;
  selected: boolean;
  copied: boolean;
};

/** Prepara las máscaras de cada tarjeta una vez y deja que CSS aplique el estilo global. */
const ExplorerCard = memo(function ExplorerCard({ item, selected, copied, onSelect, onCopy }: ExplorerCardProps) {
  const line = getExplorerVariant(item, false);
  const filled = getExplorerVariant(item, true);
  if (!line || !filled) {
    return null;
  }

  const masks = {
    "--explorer-mask-line": `url("${line.src}")`,
    "--explorer-mask-filled": `url("${filled.src}")`,
  } as CSSProperties;

  return (
    <article className="explorer-card" data-selected={selected || undefined} data-filled-src={item.line && item.filled?.src}>
      <button type="button" className="explorer-card-trigger" aria-pressed={selected} onClick={(event) => onSelect(item.id, event.currentTarget)}>
        <span className="explorer-card-stage">
          <span className="icon-artwork" aria-hidden="true">
            <span className="artwork-mask" style={masks} />
          </span>
        </span>
        <span className="explorer-card-info">
          <strong>{item.label}</strong>
          <code>{item.slug}</code>
        </span>
      </button>
      <button
        type="button"
        className="explorer-card-quickcopy"
        aria-label={`Copiar componente de ${item.label}`}
        title="Copiar componente"
        onClick={() => onCopy(item)}
      >
        {copied ? <Check /> : <Copy />}
      </button>
    </article>
  );
});

type ExplorerGridProps = CardActions & {
  items: readonly ExplorerItem[];
  selectedId: string;
  copiedKey: string;
};

/** Cambia las máscaras próximas a la ventana y prepara cada tarjeta al incorporarla al área visible. */
export const ExplorerGrid = memo(function ExplorerGrid({
  items, selectedId, copiedKey, onSelect, onCopy, filled,
}: ExplorerGridProps & { filled: boolean }) {
  const gridRef = useRef<HTMLElement>(null);
  const nearbyCards = useRef(new Set<HTMLElement>());
  const warmed = useRef(new Set<string>());
  const currentStyle = useRef(filled);
  const [canObserve, setCanObserve] = useState(true);

  useLayoutEffect(() => {
    currentStyle.current = filled;

    for (const card of nearbyCards.current) {
      card.toggleAttribute("data-filled", filled);
    }
  }, [filled]);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setCanObserve(false);

      return;
    }

    const nearby = nearbyCards.current;
    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        const card = target as HTMLElement;

        if (!isIntersecting) {
          nearby.delete(card);
          continue;
        }

        nearby.add(card);
        card.toggleAttribute("data-filled", currentStyle.current);
        const src = card.dataset.filledSrc;
        if (src && !currentStyle.current && !warmed.current.has(src)) {
          const image = new Image();
          image.fetchPriority = "low";
          image.onload = () => warmed.current.add(src);
          image.src = src;
        }
      }
    }, { rootMargin: "320px" });

    for (const card of grid.querySelectorAll("[data-filled-src]")) {
      observer.observe(card);
    }

    return () => {
      observer.disconnect();
      nearby.clear();
    };
  }, [items]);

  const cards = useMemo(() => items.map((item) => (
    <ExplorerCard
      key={item.id}
      item={item}
      selected={selectedId === item.id}
      copied={copiedKey === `card:${item.id}`}
      onSelect={onSelect}
      onCopy={onCopy}
    />
  )), [items, selectedId, copiedKey, onSelect, onCopy]);

  return (
    <section
      ref={gridRef}
      className="explorer-grid"
      aria-label="Resultados de iconos"
      data-filled-fallback={(!canObserve && filled) || undefined}
    >
      {cards}
    </section>
  );
});
