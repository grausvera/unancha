import type { MetadataRoute } from "next";
import { siteIsIndexable, siteOrigin } from "./lib/site-metadata";

/** Permite leer las directivas de indexación y anuncia el mapa solo en el sitio público. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: siteIsIndexable ? `${siteOrigin}/sitemap.xml` : undefined,
  };
}
