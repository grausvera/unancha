import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "@grausvera/unancha/motion.css";
import { PlatformNav } from "./components/platform-nav";
import { siteIsIndexable } from "./lib/site-metadata";
import "./styles/globals.css";
import "./styles/navigation.css";
import "./styles/catalogue-and-preview.css";

// El HTML se genera por petición para asociar el nonce del proxy a los scripts.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Unancha",
    template: "%s | Unancha",
  },
  robots: siteIsIndexable ? undefined : { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#050506" };

/** Establece el idioma, el tema oscuro de la marca y la navegación principal. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" data-theme="dark">
      <body>
        <a className="skip-link" href="#content">Saltar al contenido</a>
        <header className="site-header">
          <div className="page-width header-content">
            <Link className="brand-link" href="/" aria-label="Unancha, inicio">
              <img className="brand-logo-dark" src="/unancha-mark.svg" width="32" height="32" alt="" />
            </Link>
            <PlatformNav />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
