import { notFound } from "next/navigation";
import {
  getGroupLabel,
  getLatestRevision,
  getPreviewPath,
  getResourcePath,
  getRevisionPreview,
  getVariantLabel,
  resources,
  type Resource,
} from "../../lib/resources";
import { firstParam, type SearchParams } from "../../lib/query-params";
import { createPageMetadata } from "../../lib/site-metadata";
import { ResourceDetailClient, type DetailRelatedIcon, type DetailRevision } from "./detail-client";
import { getResourceTags } from "./tags";

type DetailProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
};

/** Resuelve una pareja exacta o muestra la última revisión de la variante seleccionada. */
function resolveRevision(resource: Resource, query: SearchParams) {
  const variant = firstParam(query.variant) ?? resource.defaultVariant;
  const revision = firstParam(query.revision);

  if (revision) {
    return resource.variants.find((candidate) => {
      return candidate.name === variant && String(candidate.revision) === revision;
    });
  }

  return getLatestRevision(resource, variant);
}

/** Valida el icono y la revisión antes de generar el contenido o sus metadatos. */
async function getDetail({ params, searchParams }: DetailProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const resource = resources.find((candidate) => candidate.id === `icons/${slug}`);
  if (!resource) {
    notFound();
  }

  const revision = resolveRevision(resource, query);
  if (!revision) {
    notFound();
  }

  return { resource, revision };
}

/** Identifica cada icono con una sola URL canónica para todas sus variantes y revisiones. */
export async function generateMetadata(props: DetailProps) {
  const { resource } = await getDetail(props);
  return createPageMetadata(
    getResourcePath(resource),
    `${resource.label} · Icono Forma`,
    `Icono ${resource.label} de la categoría ${getGroupLabel(resource)}. Compara contorno y sólido, descarga el SVG o copia el código para tu proyecto web.`,
  );
}

/** Abre una ficha por ID con mesa de pruebas interactiva, código de integración e iconos relacionados. */
export default async function ResourcePage(props: DetailProps) {
  const { resource, revision } = await getDetail(props);

  const revisions: DetailRevision[] = resource.variants.map((candidate) => {
    const preview = getRevisionPreview(resource, candidate);

    return {
      key: `${candidate.name}:${candidate.revision}`,
      name: candidate.name,
      label: getVariantLabel(candidate.name),
      revision: candidate.revision,
      src: preview.src,
      href: preview.href,
      downloadName: preview.downloadName,
      viewBox: candidate.viewBox,
      license: candidate.license,
      source: candidate.source,
      component: preview.component,
    };
  });

  const related: DetailRelatedIcon[] = resources
    .filter((candidate) => candidate.group === resource.group && candidate.id !== resource.id)
    .slice(0, 8)
    .flatMap((candidate) => {
      const latest = getLatestRevision(candidate);
      if (!latest) {
        return [];
      }

      return [
        {
          id: candidate.id,
          slug: candidate.id.slice("icons/".length),
          label: candidate.label,
          href: getResourcePath(candidate),
          src: getPreviewPath(latest),
        },
      ];
    });

  return (
    <ResourceDetailClient
      resource={{
        id: resource.id,
        slug: resource.id.slice("icons/".length),
        label: resource.label,
        group: resource.group,
        groupLabel: getGroupLabel(resource),
        tags: getResourceTags(resource),
      }}
      revisions={revisions}
      initialRevisionKey={`${revision.name}:${revision.revision}`}
      related={related}
    />
  );
}
