import type { MetadataRoute } from "next";
import { getResourcePath, resources } from "./lib/resources";
import { siteIsIndexable, siteOrigin } from "./lib/site-metadata";

/** Enumera páginas y fichas canónicas sin filtros, variantes ni revisiones en la URL. */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteIsIndexable) {
    return [];
  }

  const paths = ["/", "/docs", "/explorer", "/studio", ...resources.map(getResourcePath)];
  return paths.map((path) => ({ url: new URL(path, siteOrigin).href }));
}
