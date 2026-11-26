import { getCategoryName, getDownloadName, getGroupLabel, getLatestRevision, getPreviewPath, getRevisionPath, resources, type Resource } from "../lib/resources";

type Drawing = { src: string; href: string; downloadName: string; sha256: string; revision: number };
export type Sample = Drawing & {
  id: string;
  slug: string;
  label: string;
  group: string;
  groupLabel: string;
  componentName: string;
  filled?: Drawing;
};
export type CategoryShowcaseGroup = {
  id: string;
  label: string;
  description: string;
  count: number;
  items: Sample[];
};

const workbenchSlugs = [
  "compass", "aperture", "layers", "pen-tool", "wand", "palette",
  "search", "home", "sliders", "focus", "code", "terminal",
  "database", "cpu", "shield", "key", "lock", "fingerprint",
  "chart-bar", "activity", "zap", "bell", "folder", "download",
];
const marqueeTopSlugs = [
  "compass", "aperture", "layers", "pen-tool", "wand", "palette",
  "sun", "focus", "stamp", "code", "terminal", "cpu",
  "database", "shield", "fingerprint", "zap",
];
const marqueeBottomSlugs = [
  "home", "search", "sliders", "folder", "download", "bell",
  "headphones", "mountain", "sun", "moon", "bookmark", "check",
  "edit", "copy", "maximize", "external-link",
];
const featuredCategoryConfigs = [
  {
    id: "design",
    description: "Herramientas vectoriales, capas, color, óptica y precisión geométrica sobre retícula de 24 × 24 px.",
  },
  {
    id: "development",
    description: "Terminales, código, estructura de datos, ramas y símbolos técnicos pensados para entornos de ingeniería.",
  },
  {
    id: "navigation",
    description: "Orientación espacial, menús, flechas direccionales y controles de recorrido para aplicaciones web y móviles.",
  },
  {
    id: "actions",
    description: "Operaciones cotidianas de edición, búsqueda, copiado, descarga y confirmación con lectura inmediata a 16 px.",
  },
  {
    id: "users",
    description: "Identidad, autenticación, llaves criptográficas, permisos y protección de sesiones.",
  },
  {
    id: "analytics",
    description: "Métricas, tendencias, paneles de control e indicadores visuales para tableros de datos.",
  },
] as const;

const index = new Map(resources.map((resource) => [resource.id, resource]));

/** Enlaza la imagen, el nombre de descarga y la ficha a los mismos bytes de una variante del catálogo. */
function getDrawing(resource: Resource, variant: string): Drawing | undefined {
  const revision = getLatestRevision(resource, variant);
  if (revision) {
    return {
      src: getPreviewPath(revision),
      href: getRevisionPath(resource, revision),
      downloadName: getDownloadName(resource, revision),
      sha256: revision.sha256.slice(0, 12),
      revision: revision.revision,
    };
  }
}

/** Convierte un recurso del catálogo en una muestra lista para el workbench interactivo de la portada. */
function toSample(resource: Resource): Sample | undefined {
  const drawing = getDrawing(resource, resource.defaultVariant);
  if (!drawing) {
    return undefined;
  }

  const slug = resource.id.slice("icons/".length);
  const componentName = slug.split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
  const filled = getDrawing(resource, "filled");

  return {
    ...drawing,
    id: resource.id,
    slug,
    label: resource.label,
    group: resource.group,
    groupLabel: getGroupLabel(resource),
    componentName,
    filled,
  };
}

/** Selecciona muestras del catálogo a partir de sus identificadores cortos. */
function selectBySlugs(slugs: string[]) {
  const result: Sample[] = [];

  for (const slug of slugs) {
    const resource = index.get(`icons/${slug}`);
    if (!resource) {
      continue;
    }

    const sample = toSample(resource);
    if (sample) {
      result.push(sample);
    }
  }

  if (result.length < 12) {
    for (const resource of resources) {
      if (result.some((existing) => existing.id === resource.id)) {
        continue;
      }

      const sample = toSample(resource);
      if (sample) {
        result.push(sample);
      }

      if (result.length >= 20) {
        break;
      }
    }
  }

  return result;
}

export const iconSamples = selectBySlugs(workbenchSlugs);
export const marqueePrimary = selectBySlugs(marqueeTopSlugs);
export const marqueeSecondary = selectBySlugs(marqueeBottomSlugs);
export const iconCount = resources.length;
export const revisionCount = resources.reduce((sum, item) => sum + item.variants.length, 0);
export const categoryCount = new Set(resources.map((item) => item.group)).size;

export const categoryShowcases: CategoryShowcaseGroup[] = featuredCategoryConfigs.map(({ id, description }) => {
  const matching = resources.filter((resource) => resource.group === id);
  const items: Sample[] = [];

  for (const resource of matching.slice(0, 12)) {
    const sample = toSample(resource);
    if (sample) {
      items.push(sample);
    }
  }

  return {
    id,
    label: getCategoryName(id),
    description,
    count: matching.length,
    items,
  };
});
