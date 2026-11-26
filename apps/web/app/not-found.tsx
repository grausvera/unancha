import Link from "next/link";
import { ArrowRight, Compass } from "@grausvera/unancha/icons";
import "./styles/not-found.css";

/** Ofrece rutas de regreso cuando la página o el icono no están disponibles. */
export default function NotFound() {
  return (
    <main id="content" tabIndex={-1} className="not-found-page">
      <div className="not-found-content">
        <p className="not-found-status">Error 404</p>
        <h1>Página no encontrada</h1>
        <p className="not-found-description">
          Puede que el enlace haya cambiado o que la página ya no esté disponible.
          En el Explorador puedes buscar el icono y consultar sus versiones.
        </p>
        <nav className="not-found-actions" aria-label="Opciones para continuar">
          <Link href="/explorer" className="primary-action">
            Abrir el Explorador <ArrowRight aria-hidden="true" />
          </Link>
          <Link href="/" className="secondary-action">Volver al inicio</Link>
        </nav>
      </div>

      <div className="not-found-artwork" aria-hidden="true">
        <div className="not-found-guide">
          <Compass className="not-found-icon" />
        </div>
      </div>
    </main>
  );
}
