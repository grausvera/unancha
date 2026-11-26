import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Check, Compass, CompassFilled, Layers, LayersFilled, PenTool, Shield, ShieldFilled, Zap, ZapFilled } from "@grausvera/unancha/icons";
import { firstParam, type SearchParams } from "./lib/query-params";
import { createPageMetadata } from "./lib/site-metadata";
import { Opening } from "./home/hero";
import { MotionPage, ScrollHeading } from "./home/motion";
import { categoryCount, categoryShowcases, iconCount, iconSamples, marqueePrimary, marqueeSecondary, revisionCount } from "./home/selection";
import { HomeFooter } from "./home/footer";
import { FormaCover } from "./home/forma-cover";
import { IconArtwork } from "./components/icon-artwork";
import "./styles/home-landing.css";
import "./styles/home-collections.css";

export const metadata = createPageMetadata(
  "/",
  "Unancha · Iconos SVG para la web",
  `Explora ${iconCount} iconos SVG de la colección Forma, en contorno y sólido, para tus proyectos web.`,
);

const legacyCollectionAnchors = new Map([
  ["iconos", "categories"],
  ["categorias", "categories"],
  ["arquitectura", "architecture"],
]);

/** Presenta el sistema de iconos Forma con estética monocromática y efectos continuos por scroll. */
export default async function HomePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const legacy = new URLSearchParams();

  for (const key of ["kind", "q", "group", "pagina", "recurso"]) {
    const value = firstParam(params[key]);
    if (value !== undefined) {
      legacy.set(key === "recurso" ? "resource" : key === "pagina" ? "page" : key, value);
    }
  }

  if (legacy.size) {
    redirect(`/explorer?${legacy}`);
  }

  const collection = firstParam(params.vista);
  const anchor = collection ? legacyCollectionAnchors.get(collection) : undefined;
  if (anchor) {
    redirect(`/#${anchor}`);
  }

  const featuredSpecimen = iconSamples[0];
  const matrixLeft = iconSamples.slice(0, 6);
  const matrixCenter = iconSamples.slice(6, 12);
  const matrixRight = iconSamples.slice(12, 18);
  const matrixColumns = [
    { id: "left", items: matrixLeft, direction: "up", filled: false },
    { id: "center", items: matrixCenter, direction: "down", filled: true },
    { id: "right", items: matrixRight, direction: "up", filled: false },
  ] as const;

  return (
    <MotionPage>
      <Opening
        icons={iconSamples}
        marqueeTop={marqueePrimary}
        marqueeBottom={marqueeSecondary}
        count={iconCount}
        revisionCount={revisionCount}
      />

      <section className="scroll-stage-section" data-scroll-mobile="group" aria-label="Precisión óptica" data-reveal="true" data-scroll-fx="true">
        <div className="section-container scroll-stage-grid">
          <div className="scroll-stage-copy" data-scroll-fx="true">
            <span className="section-kicker">Claridad monocromática</span>
            <ScrollHeading
              as="h2"
              className="scroll-statement"
              text="Trazos precisos sobre retícula óptica. Contorno y sólido en perfecta armonía."
            />
          </div>
          <div className="scroll-parallax-matrix" data-scroll-fx="true">
            {matrixColumns.map((col) => (
              <div key={col.id} className={`v-carousel-col v-carousel-col--${col.direction}`}>
                <div className="v-carousel-track">
                  {[0, 1].map((copy) => (
                    <div key={copy} className="v-carousel-run" aria-hidden={copy === 1 || undefined}>
                      {col.items.map((item) => {
                        const targetHref = col.filled ? (item.filled?.href ?? item.href) : item.href;

                        return (
                          <Link
                            key={`${copy}-${item.id}`}
                            href={targetHref}
                            prefetch={false}
                            tabIndex={copy === 1 ? -1 : undefined}
                            aria-label={item.label}
                            title={item.label}
                            className={`parallax-glyph-card${col.filled ? " parallax-glyph-card--bright" : ""}`}
                          >
                            <IconArtwork
                              src={col.filled ? (item.filled?.src ?? item.src) : item.src}
                              size={col.filled ? 38 : 34}
                              guides={col.filled}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FormaCover categories={categoryShowcases} count={iconCount} categoryCount={categoryCount} />

      <section id="architecture" className="bento-section" data-scroll-mobile="group" aria-labelledby="bento-title" data-reveal="true" data-scroll-fx="true">
        <div className="section-container">
          <header className="section-header-compact" data-scroll-fx="true">
            <div>
              <span className="section-kicker">Sistema visual</span>
              <ScrollHeading id="bento-title" text="Geometría, variantes y código." />
            </div>
            <Link className="launch-link" href="/explorer">Abrir catálogo <ArrowRight /></Link>
          </header>

          <div className="bento-grid">
            <article className="bento-card bento-card--wide" data-reveal="true" data-scroll-fx="true">
              <div className="bento-card-head">
                <span className="bento-tag">Retícula 24 × 24</span>
                <h3>Cuatro escalas ópticas</h3>
              </div>
              {featuredSpecimen && (
                <div className="bento-visual bento-visual--scales" aria-hidden="true">
                  {[16, 20, 24, 32].map((scaleSize) => (
                    <div key={scaleSize} className="bento-scale-box">
                      <div className="bento-scale-stage">
                        <IconArtwork src={featuredSpecimen.src} size={scaleSize} guides />
                      </div>
                      <code>{scaleSize} px</code>
                    </div>
                  ))}
                </div>
              )}
            </article>

            <article className="bento-card" data-reveal="true" data-scroll-fx="true">
              <div className="bento-card-head">
                <span className="bento-tag">Doble trazo</span>
                <h3>Contorno y sólido</h3>
              </div>
              <div className="bento-visual bento-visual--duotone" aria-hidden="true">
                <div className="duotone-pair">
                  <span className="duotone-chip"><Compass /> <small>Contorno</small></span>
                  <span className="duotone-chip duotone-chip--filled"><CompassFilled /> <small>Sólido</small></span>
                </div>
                <div className="duotone-pair">
                  <span className="duotone-chip"><Layers /> <small>Contorno</small></span>
                  <span className="duotone-chip duotone-chip--filled"><LayersFilled /> <small>Sólido</small></span>
                </div>
                <div className="duotone-pair">
                  <span className="duotone-chip"><Shield /> <small>Contorno</small></span>
                  <span className="duotone-chip duotone-chip--filled"><ShieldFilled /> <small>Sólido</small></span>
                </div>
                <div className="duotone-pair">
                  <span className="duotone-chip"><Zap /> <small>Contorno</small></span>
                  <span className="duotone-chip duotone-chip--filled"><ZapFilled /> <small>Sólido</small></span>
                </div>
              </div>
            </article>

            <article className="bento-card" data-reveal="true" data-scroll-fx="true">
              <div className="bento-card-head">
                <span className="bento-tag">React ESM</span>
                <h3>Solo se incluyen los iconos que usas</h3>
              </div>
              <div className="bento-visual bento-visual--code" aria-hidden="true">
                <div className="code-snippet-window">
                  <code>
                    <span className="tok-kw">import</span>{" "}
                    <span className="tok-punct">{"{"}</span>{" "}
                    <span className="tok-id">Sun</span>{" "}
                    <span className="tok-punct">{"}"}</span>{" "}
                    <span className="tok-kw">from</span>{" "}
                    <span className="tok-str">&quot;@grausvera/unancha/icons&quot;</span>
                    <span className="tok-punct">;</span>
                  </code>
                  <div className="bundle-meter">
                    <div className="bundle-meter-row">
                      <span>Sun.js</span>
                      <strong>1 icono · 2 variantes</strong>
                    </div>
                    <div className="bundle-meter-bar"><i /></div>
                    <small><Check /> 340 iconos excluidos del código compilado</small>
                  </div>
                </div>
              </div>
            </article>

            <article className="bento-card bento-card--wide" data-reveal="true" data-scroll-fx="true">
              <div className="bento-card-head">
                <div>
                  <span className="bento-tag">Estudio</span>
                  <h3>Personaliza tus iconos</h3>
                </div>
                <Link className="launch-secondary-cta" href="/studio">Abrir Estudio <ArrowRight /></Link>
              </div>
              <div className="bento-visual bento-visual--studio" aria-hidden="true">
                <div className="studio-mini-stage">
                  <span className="studio-mini-icon"><PenTool /></span>
                </div>
                <div className="studio-mini-hud">
                  <span>Color</span>
                  <span>Tamaño y borde</span>
                  <span><code>SVG + PNG</code></span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <HomeFooter iconCount={iconCount} revisionCount={revisionCount} />
    </MotionPage>
  );
}
