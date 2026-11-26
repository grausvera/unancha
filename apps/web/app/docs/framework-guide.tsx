"use client";

import { useState } from "react";
import { navigateTabs } from "../lib/tab-keyboard";
import { CodeBlock } from "./code-block";
import { FrameworkLabel } from "./framework-label";
import { docsFrameworks, type DocsFramework } from "./frameworks";

const nuxtCode = `export default defineNuxtConfig({
  alias: { "@grausvera/unancha/icons": "@grausvera/unancha/vue" },
  typescript: {
    tsConfig: { compilerOptions: { customConditions: ["unancha-vue"] } },
  },
});`;
const astroCode = `import { defineConfig } from "astro/config";

const condition = "unancha-astro";
const conditions = ["module", "node", "development|production", condition];
const noExternal = ["@grausvera/unancha"];
const server = { resolve: { conditions, noExternal } };

export default defineConfig({
  vite: {
    resolve: { conditions: ["module", "browser", "development|production", condition] },
    ssr: { noExternal, resolve: { conditions } },
    environments: { astro: server, prerender: server },
  },
});`;
const angularCode = `{
  "conditions": ["unancha-angular"]
}`;

/** Genera un ejemplo de Vite con la condición específica de la pestaña activa. */
function viteConfig(condition: string) {
  return `const condition = "${condition}";
const serverConditions = ["module", "node", "development|production", condition];

export default {
  resolve: { conditions: ["module", "browser", "development|production", condition] },
  ssr: {
    noExternal: ["@grausvera/unancha"],
    resolve: { conditions: serverConditions },
  },
};`;
}

/** Muestra los pasos y el código de configuración del framework seleccionado. */
function FrameworkInstructions({ framework }: { framework: DocsFramework }) {
  switch (framework.id) {
    case "react":
    case "nextjs":
      return <p>Importa desde <code className="docs-reference-import">@grausvera/unancha/icons</code>. El paquete ya resuelve este adaptador por defecto.</p>;
    case "nuxt":
      return (
        <>
          <p>Agrega el alias y la condición de tipos a <code className="docs-reference-file">nuxt.config.ts</code>.</p>
          <CodeBlock label="nuxt.config.ts" kind="file" code={nuxtCode} />
        </>
      );
    case "angular":
      return (
        <>
          <p>En <code className="docs-reference-file">angular.json</code>, integra este bloque en <code>options</code> de la tarea <code>build</code>. Conserva las opciones y condiciones de tu proyecto.</p>
          <CodeBlock label="angular.json" kind="file" code={angularCode} />
          <p>Importa el icono en el componente y usa su selector sobre el SVG, como <code>unanchaSun</code>.</p>
          <p>Si Node ejecuta un servidor sin empaquetar que importa Unancha, inicia ese proceso con <code className="docs-reference-command">--conditions=unancha-angular</code>.</p>
        </>
      );
    case "astro":
      return (
        <>
          <p>Agrega la condición a los entornos de Vite en <code className="docs-reference-file">astro.config.mjs</code>.</p>
          <CodeBlock label="astro.config.mjs" kind="file" code={astroCode} />
        </>
      );
    default:
      return (
        <>
          <p>Agrega estas opciones a <code className="docs-reference-file">vite.config</code> junto con los plugins y condiciones que ya usa tu proyecto.</p>
          <CodeBlock label="vite.config" kind="file" code={viteConfig(framework.condition)} />
        </>
      );
  }
}

/** Permite consultar y copiar la configuración de un framework a la vez con navegación por teclado. */
export function FrameworkGuide() {
  const [active, setActive] = useState<DocsFramework>(docsFrameworks[0]);
  const typeCondition = "condition" in active ? active.condition : undefined;

  return (
    <div className="docs-frameworks">
      <div className="docs-framework-tabs" role="tablist" aria-label="Configuración por framework" onKeyDown={navigateTabs}>
        {docsFrameworks.map((framework) => (
          <button key={framework.id} type="button" role="tab" id={`guide-tab-${framework.id}`}
            aria-controls={`guide-panel-${framework.id}`} aria-selected={active.id === framework.id}
            tabIndex={active.id === framework.id ? 0 : -1} onClick={() => setActive(framework)}>
            <FrameworkLabel id={framework.id} label={framework.label} />
          </button>
        ))}
      </div>
      {docsFrameworks.map(({ id, label }) => (
        <div key={id} className="docs-framework-panel" role="tabpanel" id={`guide-panel-${id}`}
          aria-labelledby={`guide-tab-${id}`} tabIndex={0} hidden={active.id !== id}>
          {active.id === id && (
            <>
              <h3>{label}</h3>
              <FrameworkInstructions framework={active} />
              {typeCondition && (
                <p>En <code className="docs-reference-file">tsconfig.json</code>, agrega <code className="docs-reference-value">{typeCondition}</code> a <code>compilerOptions.customConditions</code>. Usa resolución <code className="docs-reference-value">bundler</code>, <code className="docs-reference-value">node16</code> o <code className="docs-reference-value">nodenext</code>.</p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
