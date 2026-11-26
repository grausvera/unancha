import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { DOMImplementation } from "@xmldom/xmldom";
import { build } from "esbuild";
import ts from "typescript";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { Sun as VueSun, SunFilled as VueSunFilled } from "@grausvera/unancha/vue";
import VueSunDirect from "@grausvera/unancha/vue/sun";
import { createIcon, Sun, SunFilled } from "@grausvera/unancha/web";

test("creates decorative and labeled SVG elements and supports the filled variant", () => {
  const owner = new DOMImplementation().createDocument("http://www.w3.org/1999/xhtml", "html", null);
  const decorative = createIcon(Sun, {}, owner);
  const labeled = createIcon(Sun, { variant: "filled", width: 24, role: "img", "aria-label": "Sol", "aria-hidden": false }, owner);

  assert.equal(decorative.getAttribute("width"), "1em");
  assert.equal(decorative.getAttribute("aria-hidden"), "true");
  assert.equal(labeled.getAttribute("width"), "24");
  assert.equal(labeled.getAttribute("aria-hidden"), "false");
  assert.equal(labeled.getAttribute("aria-label"), "Sol");
  assert.equal(labeled.firstChild.localName, "circle");
  assert.equal(labeled.firstChild.namespaceURI, "http://www.w3.org/2000/svg");
  assert.equal(labeled.hasAttribute("variant"), false);
  assert.equal(labeled.firstChild.getAttribute("d"), createIcon(SunFilled, {}, owner).firstChild.getAttribute("d"));
});

test("renders both Vue variants with customizable attributes", async () => {
  assert.equal(VueSun, VueSunDirect);

  const app = createSSRApp({
    /** Renderiza el componente importado como lo haría una plantilla Vue. */
    render() {
      return [h(VueSun), h(VueSun, { variant: "filled", width: 24, "aria-hidden": false, "aria-label": "Sol", class: "ink" }), h(VueSunFilled)];
    },
  });
  const html = await renderToString(app);

  assert.match(html, /<svg[^>]+width="1em"[^>]+aria-hidden="true"/);
  assert.match(html, /<svg[^>]+width="24"[^>]+aria-hidden="false"[^>]+aria-label="Sol"[^>]+class="ink"><circle/);
  assert.doesNotMatch(html, /\svariant=/);
});

test("includes only the imported Vue icon in the bundle", async () => {
  const { outputFiles } = await build({
    stdin: {
      contents: 'export { Sun } from "@grausvera/unancha/icons";',
      resolveDir: import.meta.dirname,
    },
    bundle: true,
    conditions: ["unancha-vue"],
    external: ["vue"],
    format: "esm",
    write: false,
  });

  const [bundle] = outputFiles;
  assert.match(bundle.text, /createVueIcon\("Sun"/);
  assert.doesNotMatch(bundle.text, /createVueIcon\("(?!Sun")/);
  assert.doesNotMatch(bundle.text, /from "react/);
});

test("resolves the same types from the shared and framework-specific entry points", () => {
  const consumer = fileURLToPath(new URL("consumer.mts", import.meta.url));

  for (const adapter of ["vue", "svelte", "astro", "angular", "web"]) {
    const options = {
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      customConditions: [`unancha-${adapter}`],
    };

    for (const icon of ["", "/filled/sun"]) {
      const shared = ts.resolveModuleName(`@grausvera/unancha/icons${icon}`, consumer, options, ts.sys);
      const explicit = ts.resolveModuleName(`@grausvera/unancha/${adapter}${icon}`, consumer, options, ts.sys);
      assert.ok(explicit.resolvedModule, adapter);
      assert.equal(shared.resolvedModule?.resolvedFileName, explicit.resolvedModule.resolvedFileName, adapter);
    }
  }
});
