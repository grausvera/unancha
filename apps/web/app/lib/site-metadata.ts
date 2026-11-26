import type { Metadata } from "next";

const siteUrl = process.env.SITE_URL;

/** Valida el origen configurado para las URLs públicas y descarta rutas, parámetros y credenciales. */
function getSiteOrigin(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error("SITE_URL must be an HTTPS origin without credentials, a path, query, or fragment.");
  }

  return url.origin;
}

export const siteOrigin = getSiteOrigin(siteUrl);
export const siteIsIndexable = Boolean(siteOrigin)
  && process.env.NODE_ENV === "production"
  && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === "production");

/** Define la URL canónica y la tarjeta social de una página con su título y descripción. */
export function createPageMetadata(path: string, title: string, description: string): Metadata {
  const socialTitle = path === "/" ? title : `${title} | Unancha`;
  const url = siteOrigin ? new URL(path, siteOrigin) : undefined;
  const image = siteOrigin ? new URL("/social-card.png", siteOrigin) : undefined;

  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      type: "website",
      siteName: "Unancha",
      locale: "es",
      title: socialTitle,
      description,
      url,
      images: image ? [{ url: image, width: 1200, height: 630, alt: "Unancha" }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: socialTitle,
      description,
      images: image ? [{ url: image, alt: "Unancha" }] : undefined,
    },
  };
}
