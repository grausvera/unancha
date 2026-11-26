import assert from "node:assert/strict";
import test from "node:test";
import { build } from "esbuild";

const imports = [
  ["package root", 'import { Sun } from "@grausvera/unancha";'],
  ["icon index", 'import { Sun } from "@grausvera/unancha/icons";'],
  ["direct icon path", 'import Sun from "@grausvera/unancha/icons/sun";'],
];
for (const [label, statement] of imports) {
  test(`importing Sun from the ${label} excludes other icons and the catalogue`, async () => {
    const { metafile } = await build({
      stdin: {
        contents: `${statement}\nexport { Sun };\n`,
        resolveDir: import.meta.dirname,
      },
      bundle: true,
      format: "esm",
      external: ["react", "react/*"],
      metafile: true,
      write: false,
    });

    // El empaquetador puede leer otros módulos para resolver las exportaciones.
    // Solo cuentan los que aportan bytes al resultado.
    const [output] = Object.values(metafile.outputs);
    const includedFiles = Object.entries(output.inputs)
      .filter(([, input]) => input.bytesInOutput > 0)
      .map(([path]) => path);

    const bundledIcons = includedFiles.filter((path) => path.includes("/generated/icons/"));
    assert.equal(bundledIcons.length, 2);
    assert.ok(bundledIcons.some((path) => path.endsWith("/icons/sun.js")));
    assert.ok(bundledIcons.some((path) => path.endsWith("/icons/filled/sun.js")));
    assert.ok(includedFiles.every((path) => !path.endsWith("/generated/catalogue.js")));
  });
}
