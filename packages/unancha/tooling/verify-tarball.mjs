import { execFileSync } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { verifyWebConsumers } from "./verify-web-consumers.mjs";

const npmOptions = ["install", "--ignore-scripts", "--no-audit", "--no-fund"];
const packageTests = ["package.test.mjs", "bundle.test.mjs", "web.test.mjs"];
const testDependencies = ["react", "react-dom", "esbuild", "typescript", "@types/react"];
const consumerSource = `import { Sun } from "@grausvera/unancha";
import { getAssetVersion, type AssetReference } from "@grausvera/unancha/catalogue";
import DirectSun from "@grausvera/unancha/icons/sun";
import { Sun as AstroSun } from "@grausvera/unancha/astro";
import AstroSunDirect from "@grausvera/unancha/astro/sun";
import { Sun as SvelteSun } from "@grausvera/unancha/svelte";
import SvelteSunDirect from "@grausvera/unancha/svelte/sun";
import { Sun as VueSun } from "@grausvera/unancha/vue";
import VueSunDirect from "@grausvera/unancha/vue/sun";
import { createIcon, type IconDefinition } from "@grausvera/unancha/web";
import WebSun from "@grausvera/unancha/web/sun";

// Comprueba que el índice y la ruta directa resuelven los mismos tipos públicos.
const reference: AssetReference = {
  assetId: "icons/sun",
  variant: "line",
  revision: 1,
};
const icon: typeof Sun = DirectSun;
const astroIcon: typeof AstroSun = AstroSunDirect;
const svelteIcon: typeof SvelteSun = SvelteSunDirect;
const vueIcon: typeof VueSun = VueSunDirect;
const webIcon: IconDefinition = WebSun;

export { icon, astroIcon, svelteIcon, vueIcon, webIcon, createIcon, reference, getAssetVersion };
`;

/** Instala solo el tarball y comprueba que el catálogo, la API web y los SVG son independientes. */
async function verifyStandaloneConsumer(tarball, execution) {
  const consumer = execution.cwd;
  const verificationScript = new URL("./verify-installed-catalogue.mjs", import.meta.url);
  const scriptName = "verify-catalogue.mjs";

  execFileSync("npm", [...npmOptions, tarball], execution);
  await copyFile(verificationScript, join(consumer, scriptName));
  execFileSync(process.execPath, ["--conditions=unancha-web", scriptName], execution);
}

/** Ejecuta las pruebas de las API y tipos contra el paquete instalado fuera del workspace. */
async function verifyPackageConsumers(devDependencies, execution) {
  const consumer = execution.cwd;
  const packages = testDependencies.map((name) => `${name}@${devDependencies[name]}`);
  execFileSync("npm", [...npmOptions, ...packages], execution);

  for (const file of packageTests) {
    const source = new URL(`../tests/${file}`, import.meta.url);

    await copyFile(source, join(consumer, file));
  }

  execFileSync(process.execPath, ["--test", ...packageTests], execution);

  await writeFile(join(consumer, "consumer.mts"), consumerSource);
  execFileSync(process.execPath, [
    "node_modules/typescript/bin/tsc",
    "--ignoreConfig",
    "--noEmit",
    "--skipLibCheck",
    "--strict",
    "--module", "nodenext",
    "consumer.mts",
  ], execution);
}

const [artifact] = process.argv.slice(2);

if (!artifact) {
  throw new Error("Usage: pnpm verify:tarball <package.tgz>");
}

const tarball = resolve(artifact);
const packageUrl = new URL("../package.json", import.meta.url);
const { devDependencies } = JSON.parse(await readFile(packageUrl, "utf8"));
const consumer = await mkdtemp(join(tmpdir(), "unancha-consumer-"));
const execution = { cwd: consumer, stdio: "inherit" };

// Mantener el consumidor aislado permite detectar archivos ausentes en el tarball.
try {
  await writeFile(join(consumer, "package.json"), '{"private":true,"type":"module"}\n');
  await verifyStandaloneConsumer(tarball, execution);
  await verifyWebConsumers(devDependencies, npmOptions, execution);
  await verifyPackageConsumers(devDependencies, execution);
} finally {
  await rm(consumer, { recursive: true, force: true });
}
