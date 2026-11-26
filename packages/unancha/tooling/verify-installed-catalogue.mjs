import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { catalogue, getAssetVersion } from "@grausvera/unancha/catalogue";
import { createIcon, Sun } from "@grausvera/unancha/web";
import SunDirect from "@grausvera/unancha/web/sun";
import { createIcon as sharedCreateIcon, Sun as sharedSun } from "@grausvera/unancha/icons";
import sharedSunDirect from "@grausvera/unancha/icons/sun";

// Esta fase comprueba que instalar Unancha permite usar las entradas neutrales por sí solas.
const require = createRequire(import.meta.url);

for (const framework of ["react", "vue", "svelte", "astro", "@angular/core"]) {
  assert.throws(() => require.resolve(framework), { code: "MODULE_NOT_FOUND" });
}

assert.equal(Sun, SunDirect);
assert.equal(Sun, sharedSun);
assert.equal(SunDirect, sharedSunDirect);
assert.equal(createIcon, sharedCreateIcon);
assert.equal(Sun.tag, "svg");
assert.equal(typeof createIcon, "function");
assert.ok(catalogue.entries.length > 0);

let checked = 0;

for (const asset of catalogue.entries) {
  for (const variant of asset.variants) {
    const reference = {
      assetId: asset.id,
      variant: variant.name,
      revision: variant.revision,
    };
    assert.deepEqual(getAssetVersion(reference), variant);
    const assetUrl = import.meta.resolve(`@grausvera/unancha/assets/${variant.path}`);
    const bytes = await readFile(new URL(assetUrl));
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    assert.equal(sha256, variant.sha256, variant.path);
    checked += 1;
  }
}

console.log(`Verified ${checked} installed SVG revisions and the Web API without frameworks.`);
