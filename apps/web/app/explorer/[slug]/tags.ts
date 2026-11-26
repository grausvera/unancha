import { normalizeSearch } from "../../lib/normalize-search";
import type { Resource } from "../../lib/resources";

export type ResourceTag = { label: string; keyword: string };

const tagLabels = new Map([
  ["agile", "metodologías ágiles"],
  ["checklist", "lista de verificación"],
  ["deploy", "despliegue"],
  ["ecommerce", "comercio electrónico"],
  ["email", "correo electrónico"],
  ["gateway", "puerta de enlace"],
  ["kebab", "menú de tres puntos"],
  ["layout", "distribución"],
  ["pipeline", "secuencia de tareas"],
  ["query", "consulta"],
  ["retail", "venta minorista"],
  ["spinner", "indicador de carga"],
  ["todo", "por hacer"],
]);

/** Presenta etiquetas del catálogo y conserva los términos originales en los enlaces de búsqueda. */
export function getResourceTags(resource: Resource): ResourceTag[] {
  const slug = resource.id.slice("icons/".length);
  const componentAlias = slug.replaceAll("-", "");
  const resourceLabel = normalizeSearch(resource.label);
  const tags = new Map<string, ResourceTag>();

  for (const keyword of resource.keywords) {
    const normalizedKeyword = normalizeSearch(keyword);
    const isTechnicalAlias = keyword === slug || keyword === componentAlias;
    if (isTechnicalAlias && normalizedKeyword !== resourceLabel) {
      continue;
    }

    const label = normalizedKeyword === resourceLabel ? resource.label : tagLabels.get(keyword) ?? keyword;
    const key = normalizeSearch(label);
    if (!tags.has(key)) {
      tags.set(key, { label, keyword });
    }
  }

  return [...tags.values()];
}
