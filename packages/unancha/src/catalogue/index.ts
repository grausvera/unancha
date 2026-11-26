import { generatedCatalogue } from "../generated/catalogue.js";
import type { Asset, AssetReference, AssetRevision, Catalogue } from "./types.js";

export type { Asset, AssetReference, AssetRevision, Catalogue } from "./types.js";

export const catalogue: Catalogue = generatedCatalogue;

// Se crea el índice una sola vez para resolver IDs sin recorrer toda la colección.
const assetsById = new Map<string, Asset>();

for (const asset of catalogue.entries) {
  assetsById.set(asset.id, asset);
}

/** Devuelve los metadatos de un recurso a partir de su identificador estable. */
export function getAsset(assetId: string): Asset | undefined {
  return assetsById.get(assetId);
}

/** Resuelve una revisión exacta; una variante ausente no se sustituye por la predeterminada. */
export function getAssetVersion(reference: AssetReference): AssetRevision | undefined {
  const asset = getAsset(reference.assetId);

  return asset?.variants.find((variant) => {
    return variant.name === reference.variant && variant.revision === reference.revision;
  });
}
