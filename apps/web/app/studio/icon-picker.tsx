import { memo } from "react";
import { Search, X } from "@grausvera/unancha/icons";
import { IconArtwork } from "../components/icon-artwork";

type PickerItem = {
  assetId: string;
  label: string;
  line?: { url: string };
  filled?: { url: string };
};

type StudioPickerProps = {
  items: readonly PickerItem[];
  query: string;
  selectedIds: readonly string[];
  onQuery: (query: string) => void;
  onSelect: (id: string) => void;
};

/** Aísla la galería de los ajustes de color, tamaño y geometría del lienzo. */
export const StudioPicker = memo(function StudioPicker({ items, query, selectedIds, onQuery, onSelect }: StudioPickerProps) {
  return (
    <aside className="studio-picker-panel" aria-label="Selector de iconos">
      <div className="studio-picker-head">
        <div className="explorer-search-box">
          <Search />
          <input
            type="search"
            value={query}
            placeholder="Buscar icono…"
            aria-label="Buscar iconos para el estudio"
            onChange={(e) => onQuery(e.currentTarget.value)}
          />
          {query && (
            <button
              type="button"
              className="explorer-search-clear"
              aria-label="Limpiar búsqueda"
              onClick={() => onQuery("")}
            >
              <X />
            </button>
          )}
        </div>
      </div>

      <div className="studio-icon-grid">
        {items.map((item) => {
          const drawing = item.line ?? item.filled;
          if (!drawing) {
            return null;
          }

          const isActive = selectedIds.includes(item.assetId);

          return (
            <button
              key={item.assetId}
              type="button"
              className="studio-icon-tile"
              data-active={isActive || undefined}
              title={item.label}
              aria-pressed={isActive}
              onClick={() => onSelect(item.assetId)}
            >
              <IconArtwork src={drawing.url} size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
});
