import Link from "next/link";
import { ArrowRight } from "@grausvera/unancha/icons";
import { createPageMetadata } from "../lib/site-metadata";
import { CodeBlock } from "./code-block";
import { FrameworkGuide } from "./framework-guide";
import { IconPlayground } from "./icon-playground";
import "./docs.css";

export const metadata = createPageMetadata(
  "/docs",
  "Documentación",
  "Instala los iconos de Unancha y aprende a usarlos, personalizarlos e integrarlos en tu proyecto web.",
);

const sections = [
  { id: "instalacion", label: "Instalación" },
  { id: "uso", label: "Uso y variantes" },
  { id: "integracion", label: "Por framework" },
  { id: "apariencia", label: "Apariencia y accesibilidad" },
  { id: "svg", label: "SVG y revisiones" },
];

const installCode = `npm install @grausvera/unancha`;
const motionCode = `@import "@grausvera/unancha/motion.css";`;
const svgCode = `<img src="/icons/sun.svg" width="24" height="24" alt="">`;

/** Reúne lo necesario para integrar los iconos y enlaza el Explorador para probar cada dibujo. */
export default function DocsPage() {
  return (
    <main id="content" tabIndex={-1} className="docs-page">
      <header className="docs-heading">
        <div>
          <h1>Documentación</h1>
          <p>Instala Unancha y usa los iconos de la colección Forma en tu proyecto web.</p>
          <a className="docs-link" href="#uso">Probar el icono Sol <ArrowRight /></a>
        </div>
      </header>

      <div className="docs-layout">
        <nav className="docs-index" aria-label="En esta página">
          <span>En esta página</span>
          <ul>
            {sections.map(({ id, label }) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
          </ul>
        </nav>

        <article className="docs-content" aria-label="Guía de Unancha">
          <section id="instalacion" aria-labelledby="docs-install">
            <h2 id="docs-install">Instalación</h2>
            <p>Ejecuta este comando desde la carpeta de tu proyecto.</p>
            <CodeBlock label="Terminal" code={installCode} language="shell" />
          </section>

          <section id="uso" aria-labelledby="docs-usage">
            <h2 id="docs-usage">Uso y variantes</h2>
            <p>En React y Next.js puedes importar desde <code className="docs-reference-import">@grausvera/unancha/icons</code> directamente. <code>variant</code> elige el dibujo. Usa <code className="docs-reference-value">line</code> para contorno o <code className="docs-reference-value">filled</code> para sólido. El valor predeterminado es <code className="docs-reference-value">line</code>.</p>
            <IconPlayground />
            <p>Abre un icono en el <Link href="/explorer">Explorador</Link> y usa «Úsalo con» para copiar un ejemplo con tus ajustes y tu framework.</p>
          </section>

          <section id="integracion" aria-labelledby="docs-frameworks">
            <h2 id="docs-frameworks">Por framework</h2>
            <p>Configura el adaptador una vez para usar <code className="docs-reference-import">@grausvera/unancha/icons</code> en toda la aplicación.</p>
            <FrameworkGuide />
          </section>

          <section id="apariencia" aria-labelledby="docs-appearance">
            <h2 id="docs-appearance">Apariencia y accesibilidad</h2>
            <ul className="docs-list">
              <li>Usa <code>width</code> y <code>height</code> para el tamaño. El color hereda el texto que lo rodea mediante <code className="docs-reference-value">currentColor</code>.</li>
              <li>Los iconos son decorativos por defecto. En un botón que solo tiene un icono, pon el nombre accesible en el botón. Para un icono informativo independiente, usa <code>role="img"</code>, <code>aria-label</code> y <code>aria-hidden="false"</code>. En React, pasa <code>aria-hidden=&#123;false&#125;</code>.</li>
              <li>Para animar, importa la hoja de estilos en tu CSS global y aplica <code>unancha-icon-spin</code> o <code>unancha-icon-pulse</code>. Ambas clases respetan la preferencia de movimiento reducido.</li>
            </ul>
            <CodeBlock label="CSS global" code={motionCode} language="css" />
          </section>

          <section id="svg" aria-labelledby="docs-svg">
            <h2 id="docs-svg">SVG y revisiones</h2>
            <p>Descarga un SVG desde el Explorador. Para usarlo como imagen, guárdalo en la carpeta pública de tu web. Si el icono comunica información, describe su significado en <code>alt</code>.</p>
            <CodeBlock label="HTML" code={svgCode} />
            <p>Las fichas permiten copiar un enlace a una revisión exacta. Si trabajas desde el paquete, <code className="docs-reference-import">@grausvera/unancha/catalogue</code> permite consultar sus metadatos y su SVG original. Los iconos se distribuyen con <a href="/licenses/MIT.txt">licencia MIT</a>.</p>
          </section>
        </article>
      </div>
    </main>
  );
}
