import Link from "next/link";
import { ArrowRight } from "@grausvera/unancha/icons";
import { ScrollHeading } from "./motion";
import "../styles/home-footer.css";

/** Cierra la portada con la navegación de Forma y el crédito de su licencia. */
export function HomeFooter({ iconCount, revisionCount }: { iconCount: number; revisionCount: number }) {
  return (
    <footer className="launch-footer" role="contentinfo" data-reveal="true" data-scroll-fx="true">
      <div className="section-container">
        <div className="footer-cta-card" data-scroll-fx="true">
          <div className="footer-cta-copy">
            <span className="section-kicker">{iconCount} iconos · {revisionCount} SVG</span>
            <ScrollHeading text="Encuentra tu próximo icono." />
          </div>
          <div className="footer-cta-actions-wrap">
            <div className="footer-cta-buttons">
              <Link className="launch-cta" href="/explorer">Explorar los {iconCount} iconos <ArrowRight aria-hidden="true" /></Link>
              <Link className="launch-secondary-cta" href="/studio">Abrir Estudio</Link>
            </div>
          </div>
        </div>

        <div className="footer-grid" data-scroll-fx="true">
          <div className="footer-brand-block">
            <Link className="footer-brand-wordmark" href="/" aria-label="unancha, inicio">
              <img src="/unancha-wordmark.svg" width="88" height="21" alt="" loading="lazy" />
            </Link>
            <p className="footer-brand-summary">
              Iconos de código abierto para diseñar y construir interfaces.
            </p>
          </div>

          <nav className="footer-columns" aria-label="Navegación del pie">
            <div className="footer-col">
              <h3>Plataforma</h3>
              <Link href="/explorer">Explorador</Link>
              <Link href="/studio">Estudio</Link>
              <Link href="/docs">Documentación</Link>
            </div>
            <div className="footer-col">
              <h3>Colección Forma</h3>
              <a href="#categories">Categorías</a>
              <a href="#architecture">Retícula 24 × 24</a>
            </div>
            <div className="footer-col">
              <h3>Familias</h3>
              <Link href="/explorer?group=design">Diseño y creatividad</Link>
              <Link href="/explorer?group=development">Desarrollo</Link>
              <Link href="/explorer?group=navigation">Navegación</Link>
              <Link href="/explorer?group=users">Usuarios y seguridad</Link>
            </div>
          </nav>
        </div>

        <div className="footer-legal-bar">
          <span>© 2026 <a href="https://grausvera.com">grausvera</a></span>
          <a href="/licenses/MIT.txt">Licencia MIT</a>
        </div>
      </div>
    </footer>
  );
}
