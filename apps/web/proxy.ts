import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { siteIsIndexable } from "./app/lib/site-metadata";

const devMode = process.env.NODE_ENV === "development";

/** Entrega a Next y al navegador el mismo nonce para los scripts de cada documento. */
export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${devMode ? " 'unsafe-eval'" : ""}`,
    // Los controles de apariencia ajustan estilos en línea durante la interacción.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${devMode ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  if (!siteIsIndexable) {
    response.headers.set("X-Robots-Tag", "noindex");
  }

  return response;
}

export const config = {
  // Los recursos estáticos y el mapa del sitio no renderizan scripts de Next.
  matcher: ["/((?!_next/|previews/|fonts/|licenses/|(?:robots\\.txt|sitemap\\.xml|icon\\.svg|unancha-mark\\.svg|unancha-wordmark\\.svg|social-card\\.png)$).*)"],
};
