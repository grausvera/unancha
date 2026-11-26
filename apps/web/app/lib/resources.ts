import { catalogue, type Asset, type AssetRevision } from "@grausvera/unancha/catalogue";

export type Resource = Asset;

export const resources: readonly Resource[] = catalogue.entries;

const iconGroups = new Map([
  ["navigation", "Navegación e interfaz"],
  ["actions", "Acciones y edición"],
  ["files", "Archivos y carpetas"],
  ["users", "Usuarios y seguridad"],
  ["communication", "Comunicación"],
  ["status", "Estados y alertas"],
  ["design", "Diseño y creatividad"],
  ["media", "Imágenes y multimedia"],
  ["development", "Desarrollo y tecnología"],
  ["commerce", "Comercio y pagos"],
  ["productivity", "Organización y productividad"],
  ["analytics", "Datos y analítica"],
  ["location", "Ubicación y transporte"],
  ["devices", "Dispositivos y conectividad"],
  ["identity", "Identidad, marca y recursos"],
]);

/** Devuelve el nombre visible del grupo del icono. */
export function getGroupLabel(resource: Resource) {
  return iconGroups.get(resource.group) ?? resource.group;
}

/** Devuelve el nombre visible de una categoría por su identificador. */
export function getCategoryName(groupId: string) {
  return iconGroups.get(groupId) ?? groupId;
}

/** Selecciona la versión más reciente de la variante solicitada o la predeterminada. */
export function getLatestRevision(resource: Resource, variant = resource.defaultVariant) {
  let latest: AssetRevision | undefined;

  for (const candidate of resource.variants) {
    if (candidate.name === variant && candidate.revision > (latest?.revision ?? 0)) {
      latest = candidate;
    }
  }

  return latest;
}

/** Mantiene la misma ruta de bytes para la vista previa y la descarga. */
export function getPreviewPath(revision: AssetRevision) {
  return `/previews/${revision.path}`;
}

/** Identifica el dibujo descargado por recurso, variante y revisión. */
export function getDownloadName(resource: Resource, revision: AssetRevision) {
  const id = resource.id.slice("icons/".length);

  return `unancha-${id}-${revision.name}-r${revision.revision}.svg`;
}

/** Ubica la ficha bajo el Explorador usando el slug público del icono. */
export function getResourcePath(resource: Resource) {
  return `/explorer/${resource.id.slice("icons/".length)}`;
}

/** Presenta las variantes comunes en español y conserva nombres específicos del catálogo. */
export function getVariantLabel(name: string) {
  switch (name) {
    case "line":
    case "outline":
      return "Contorno";
    case "filled":
    case "solid":
      return "Sólido";
    case "default":
    case "native":
      return "Original";
    default:
      return name;
  }
}

/** Construye un enlace que seguirá identificando estos mismos bytes al publicar revisiones nuevas. */
export function getRevisionPath(resource: Resource, revision: AssetRevision) {
  const params = new URLSearchParams({ variant: revision.name, revision: String(revision.revision) });

  return `${getResourcePath(resource)}?${params}`;
}

/** Lleva al visor los datos de esta revisión y la exportación de código cuando la variante está vigente. */
export function getRevisionPreview(resource: Resource, revision: AssetRevision) {
  const isCurrent = getLatestRevision(resource, revision.name)?.revision === revision.revision;
  const filled = revision.name === "filled";
  let component: { name: string; module: string } | undefined;

  if (isCurrent && (filled || revision.name === resource.defaultVariant)) {
    const slug = resource.id.slice("icons/".length);
    const name = slug.split("-").map((word) => word[0].toUpperCase() + word.slice(1)).join("");
    const path = filled ? `filled/${slug}` : slug;
    component = { name: filled ? `${name}Filled` : name, module: `@grausvera/unancha/icons/${path}` };
  }

  return {
    label: getVariantLabel(revision.name),
    src: getPreviewPath(revision),
    href: getRevisionPath(resource, revision),
    downloadName: getDownloadName(resource, revision),
    component,
  };
}
