import { getRevisionPreview, resources } from "../lib/resources";
import { createPageMetadata } from "../lib/site-metadata";
import { Studio } from "./studio";

export const metadata = createPageMetadata(
  "/studio",
  "Estudio de iconos",
  "Personaliza los iconos de Unancha con colores, fondos y bordes, y exporta el resultado en SVG o PNG.",
);

/** Prepara las revisiones públicas para el selector de Studio. */
export default function StudioPage() {
  const catalogue = resources.flatMap((resource) => resource.variants.map((revision) => {
    const preview = getRevisionPreview(resource, revision);

    return {
      assetId: resource.id,
      variant: revision.name,
      revision: revision.revision,
      label: resource.label,
      url: preview.src,
      packageAsset: `@grausvera/unancha/assets/${revision.path}`,
      reactModule: preview.component?.module,
    };
  }));

  return <Studio catalogue={catalogue} />;
}
