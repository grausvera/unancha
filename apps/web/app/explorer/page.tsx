import { getGroupLabel, getLatestRevision, getRevisionPreview, resources } from "../lib/resources";
import { firstParam, type SearchParams } from "../lib/query-params";
import { createPageMetadata } from "../lib/site-metadata";
import { getGroups, readFilters } from "./filters";
import type { ExplorerItem, ExplorerVariant } from "./catalogue";
import { ExplorerClient } from "./explorer-client";

export const metadata = createPageMetadata(
  "/explorer",
  "Explorador de iconos",
  "Busca iconos SVG por nombre o categoría, prueba sus variantes y copia el código para tu framework.",
);

/** Prepara los metadatos y rutas de revisión del catálogo para la galería interactiva de Explorer. */
function buildExplorerItems(): ExplorerItem[] {
  return resources.map((resource) => {
    const slug = resource.id.slice("icons/".length);
    const groupLabel = getGroupLabel(resource);

    /** Extrae los datos de vista previa, descarga y hash para una variante concreta. */
    function buildVariant(name: string): ExplorerVariant | undefined {
      const revision = getLatestRevision(resource, name);
      if (!revision) {
        return undefined;
      }

      const preview = getRevisionPreview(resource, revision);

      return {
        name: revision.name,
        label: preview.label,
        revision: revision.revision,
        src: preview.src,
        href: preview.href,
        downloadName: preview.downloadName,
        sha256: revision.sha256.slice(0, 12),
        componentName: preview.component?.name,
      };
    }

    return {
      id: resource.id,
      slug,
      label: resource.label,
      group: resource.group,
      groupLabel,
      keywords: resource.keywords,
      line: buildVariant("line"),
      filled: buildVariant("filled"),
    };
  });
}

/** Conserva los filtros iniciales de URL y entrega el catálogo completo al visor interactivo. */
export default async function ExplorerPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filters = readFilters(params);
  const groups = getGroups(filters.kind);
  const requested = firstParam(params.resource) ?? firstParam(params.recurso) ?? "";
  const items = buildExplorerItems();

  return (
    <ExplorerClient
      items={items}
      groups={groups}
      initialQuery={filters.query}
      initialGroup={filters.group}
      initialSelectedId={requested}
    />
  );
}
