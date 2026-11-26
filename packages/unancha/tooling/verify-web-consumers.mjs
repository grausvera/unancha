import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const packageName = "@grausvera/unancha";
const svelteKitVersion = "3.4.1";
const sveltePluginVersion = "7.3.2";
const viteVersion = "8.4.0";
const nuxtVersion = "4.7.0";

/** Configura la condición para el cliente y el servidor de una app de prueba con Vite. */
function viteConfig(adapter, config) {
  return `${config.imports}
const condition = "unancha-${adapter}";
const conditions = ["module", "node", "development|production", condition];
const noExternal = ["${packageName}"];
const vite = {
  resolve: { conditions: ["module", "browser", "development|production", condition] },
  ssr: { noExternal, resolve: { conditions } },
};

export default ${config.export};`;
}

/** Escribe una app de prueba aislada sin paquetes ni configuración propios del workspace. */
async function writeProject(directory, files) {
  await Promise.all(Object.entries(files).map(async ([name, contents]) => {
    const path = join(directory, name);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents);
  }));
}

/** Comprueba que los consumidores renderizan ambas variantes y respetan los atributos personalizados. */
function assertRenderedIcons(html) {
  assert.match(html, /<svg[^>]+width="24"[^>]*>(?:\s|<!--[\s\S]*?-->)*<path\b/);
  assert.match(html, /<svg[^>]+width="1em"[^>]*>(?:\s|<!--[\s\S]*?-->)*<circle\b/);
  assert.equal([...html.matchAll(/<circle\b/g)].length, 2);
  assert.doesNotMatch(html, /<svg[^>]+\svariant=/);
}

/** Compila apps de ejemplo contra las rutas públicas del tarball, con los compiladores de cada framework. */
export async function verifyWebConsumers(devDependencies, npmOptions, execution) {
  const angularVersion = devDependencies["@angular/core"];
  const dependencies = [
    `astro@${devDependencies.astro}`,
    `svelte@${devDependencies.svelte}`,
    `vue@${devDependencies.vue}`,
    `@angular/compiler-cli@${angularVersion}`,
    `@angular/platform-server@${angularVersion}`,
    "@types/node@^24.0.0",
    `@sveltejs/kit@${svelteKitVersion}`,
    `@sveltejs/vite-plugin-svelte@${sveltePluginVersion}`,
    `nuxt@${nuxtVersion}`,
    `typescript@${devDependencies.typescript}`,
    `vite@${viteVersion}`,
    `@xmldom/xmldom@${devDependencies["@xmldom/xmldom"]}`,
  ];
  execFileSync("npm", [...npmOptions, ...dependencies], execution);

  /** Ejecuta la herramienta instalada en el consumidor desde la carpeta de su app de prueba. */
  function run(project, bin, ...args) {
    const path = join(execution.cwd, "node_modules", ".bin", bin);
    execFileSync(path, args, {
      ...execution,
      cwd: project,
      // Mantiene desactivado el envío de métricas de Astro y Nuxt durante las pruebas.
      env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1", NUXT_TELEMETRY_DISABLED: "1" },
    });
  }

  const astro = join(execution.cwd, "astro-app");
  await writeProject(astro, {
    "astro.config.mjs": viteConfig("astro", {
      imports: 'import { defineConfig } from "astro/config";',
      export: `defineConfig({
  vite: {
    ...vite,
    environments: {
      astro: { resolve: { conditions, noExternal } },
      prerender: { resolve: { conditions, noExternal } },
    },
  },
})`,
    }),
    "src/pages/index.astro": `---
import { Sun } from "${packageName}/icons";
import SunFilled from "${packageName}/icons/filled/sun";
---
<Sun width={24} />
<Sun variant="filled" />
<SunFilled />`,
  });
  run(astro, "astro", "build");
  assertRenderedIcons(await readFile(join(astro, "dist/index.html"), "utf8"));

  const svelteKit = join(execution.cwd, "svelte-app");
  await writeProject(svelteKit, {
    "vite.config.js": viteConfig("svelte", {
      imports: 'import { sveltekit } from "@sveltejs/kit/vite";',
      export: "{ ...vite, plugins: [sveltekit()] }",
    }),
    "src/app.html": `<!doctype html><html lang="es"><head>%sveltekit.head%</head><body>%sveltekit.body%</body></html>`,
    "src/routes/+page.js": "export const prerender = true;",
    "src/routes/+page.svelte": `<script>
  import { Sun } from "${packageName}/icons";
  import SunFilled from "${packageName}/icons/filled/sun";
</script>
<Sun width={24} />
<Sun variant="filled" />
<SunFilled />`,
  });
  run(svelteKit, "vite", "build");
  assertRenderedIcons(await readFile(join(svelteKit, ".svelte-kit/output/prerendered/pages/index.html"), "utf8"));

  const nuxt = join(execution.cwd, "nuxt-app");
  await writeProject(nuxt, {
    "nuxt.config.ts": `import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  alias: { "${packageName}/icons": "${packageName}/vue" },
  typescript: { tsConfig: { compilerOptions: { customConditions: ["unancha-vue"] } } },
});`,
    "app/app.vue": `<script setup>
import { Sun } from "${packageName}/icons";
import SunFilled from "${packageName}/icons/filled/sun";
</script>
<template><Sun width="24" /><Sun variant="filled" /><SunFilled /></template>`,
  });
  run(nuxt, "nuxt", "generate");
  assertRenderedIcons(await readFile(join(nuxt, ".output/public/index.html"), "utf8"));

  const angular = join(execution.cwd, "angular-app");
  await writeProject(angular, {
    "tsconfig.json": JSON.stringify({
      compilerOptions: {
        module: "NodeNext",
        customConditions: ["unancha-angular"],
        target: "ES2022",
        experimentalDecorators: true,
        outDir: "dist",
        skipLibCheck: true,
        strict: true,
        types: ["node"],
      },
      angularCompilerOptions: { strictTemplates: true },
      files: ["main.ts"],
    }),
    "main.ts": `import "@angular/compiler";
import { Component } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideServerRendering, renderApplication } from "@angular/platform-server";
import { Sun } from "${packageName}/icons";
import SunFilled from "${packageName}/icons/filled/sun";

/** Prueba los selectores standalone sobre SVG reales del componente anfitrión. */
@Component({
  selector: "app-root",
  imports: [Sun, SunFilled],
  template: '<svg unanchaSun [attr.width]="24"></svg><svg unanchaSun [variant]="&quot;filled&quot;"></svg><svg unanchaSunFilled></svg>',
})
class App {}

const html = await renderApplication(
  (context) => bootstrapApplication(App, { providers: [provideServerRendering()] }, context),
  { document: '<app-root></app-root>', url: 'http://localhost/', allowedHosts: ['localhost'] },
);
console.log(html);`,
  });
  run(angular, "ngc", "-p", "tsconfig.json");

  const html = execFileSync(process.execPath, ["--conditions=unancha-angular", join(angular, "dist/main.js")], {
    cwd: angular,
    encoding: "utf8",
  });
  assertRenderedIcons(html);
}
