import { getGroupLabel, resources, type Resource } from "../lib/resources";

import { firstParam, type SearchParams } from "../lib/query-params";

type SearchFilters = {
  query: string;
  kind: Resource["kind"] | "";
  group: string;
};

/** Devuelve las categorías de iconos ordenadas por nombre con su cantidad de recursos. */
export function getGroups(kind?: SearchFilters["kind"]) {
  const counts = new Map<string, number>();
  const labels = new Map<string, string>();

  for (const resource of resources) {
    if (!kind || resource.kind === kind) {
      labels.set(resource.group, getGroupLabel(resource));
      counts.set(resource.group, (counts.get(resource.group) ?? 0) + 1);
    }
  }

  return Array.from(labels, ([id, label]) => ({ id, label, count: counts.get(id) ?? 0 }))
    .sort((first, second) => first.label.localeCompare(second.label, "es"));
}

/** Normaliza la URL y descarta grupos que no existen en el catálogo de iconos. */
export function readFilters(params: SearchParams): SearchFilters {
  const requestedKind = firstParam(params.kind);
  const kind = requestedKind === "icon" ? "icon" : "";
  const group = firstParam(params.group);
  const availableGroups = getGroups(kind);

  return {
    query: firstParam(params.q)?.trim() ?? "",
    kind,
    group: group && availableGroups.some(({ id }) => id === group) ? group : "",
  };
}
