import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { transform } from "@svgr/core";
import jsx from "@svgr/plugin-jsx";
import { getIconAssetPath, readSvgMetadata } from "./svg-metadata.mjs";
import { writeWebAdapters } from "./generate-web.mjs";

const sourceUrl = new URL("../catalogue.source.json", import.meta.url);
const assetsUrl = new URL("../assets/", import.meta.url);
const generatedUrl = new URL("../src/generated/", import.meta.url);
const distUrl = new URL("../dist/", import.meta.url);
const generatedHeader = "// Archivo generado desde los SVG y el catálogo fuente de Unancha.\n";

// Las propiedades del consumidor se aplican al final para permitir ajustes de tamaño y accesibilidad.
const componentOptions = {
  plugins: [jsx],
  runtimeConfig: false,
  jsxRuntime: "automatic",
  typescript: true,
  expandProps: "end",
  svgProps: {
    width: "1em",
    height: "1em",
    "aria-hidden": "true",
    focusable: "false",
  },
};

/** Valida todas las revisiones y conserva los bytes comprobados de los dibujos vigentes. */
async function readIconDrawings(asset) {
  const revisions = new Set();
  let defaultSvg;
  let defaultRevision = 0;
  let filledSvg;
  let filledRevision = 0;

  for (const variant of asset.variants) {
    const revisionKey = `${variant.name}/${variant.revision}`;
    const expectedPath = getIconAssetPath(asset.id, variant.name, variant.revision);
    const validVariantName = /^[a-z][a-z0-9-]*$/.test(variant.name);
    const validRevision = Number.isSafeInteger(variant.revision) && variant.revision > 0;

    // La ruta canónica vincula el archivo físico con su referencia en el catálogo.
    if (!validVariantName || !validRevision || variant.path !== expectedPath || revisions.has(revisionKey)) {
      throw new Error(`Invalid or duplicate asset revision: ${expectedPath}`);
    }

    revisions.add(revisionKey);

    const bytes = await readFile(new URL(variant.path, assetsUrl));
    const { svg, sha256, viewBox } = readSvgMetadata(bytes);

    if (sha256 !== variant.sha256 || viewBox !== variant.viewBox) {
      throw new Error(`Asset hash or viewBox mismatch: ${variant.path}`);
    }

    // El orden del manifiesto puede cambiar. La revisión numérica determina qué dibujo se renderiza.
    if (variant.name === asset.defaultVariant && variant.revision > defaultRevision) {
      defaultSvg = svg;
      defaultRevision = variant.revision;
    }

    if (variant.name === "filled" && variant.revision > filledRevision) {
      filledSvg = svg;
      filledRevision = variant.revision;
    }
  }

  if (defaultSvg === undefined) {
    throw new Error(`Default variant is missing: ${asset.id}`);
  }

  return { defaultSvg, filledSvg };
}

/** Reemplaza los archivos generados después de validar y transformar toda la colección. */
async function writeGeneratedFiles(catalogue, components) {
  await rm(generatedUrl, { recursive: true, force: true });
  await rm(distUrl, { recursive: true, force: true });
  await mkdir(new URL("icons/", generatedUrl), { recursive: true });

  const catalogueJson = JSON.stringify(catalogue, null, 2);
  const catalogueModule = `${generatedHeader}export const generatedCatalogue = ${catalogueJson} as const;\n`;

  await writeFile(new URL("catalogue.ts", generatedUrl), catalogueModule);

  // Los módulos individuales permiten importar un icono sin cargar la geometría de los demás.
  const exports = [];

  for (const component of components) {
    const moduleUrl = new URL(`icons/${component.key}.tsx`, generatedUrl);

    await mkdir(new URL("./", moduleUrl), { recursive: true });
    await writeFile(moduleUrl, `${generatedHeader}${component.body}\n`);
    exports.push(`export { default as ${component.name} } from "./icons/${component.key}.js";`);
  }

  await writeFile(new URL("icons.ts", generatedUrl), `${generatedHeader}${exports.join("\n")}\n`);
}

/** Prepara los componentes React y los dibujos que comparten los demás adaptadores. */
async function buildIconComponents(asset, componentName) {
  const { defaultSvg, filledSvg } = await readIconDrawings(asset);
  const key = asset.id.slice("icons/".length);
  const hasVariants = filledSvg && asset.defaultVariant === "line";
  let body = await transform(defaultSvg, componentOptions, { componentName: hasVariants ? "OutlineIcon" : componentName });

  if (hasVariants) {
    // La entrada principal selecciona el dibujo y la entrada de relleno sigue siendo independiente.
    body = `${body.replace(/^(import[^\n]*\n)/, `$1import FilledIcon from "./filled/${key}.js";\n`).replace("export default OutlineIcon;", "")}
/** Renderiza el dibujo de la variante seleccionada y aplica los atributos al SVG. */
export default function ${componentName}({ variant = "line", ...props }: SVGProps<SVGSVGElement> & { variant?: "line" | "filled" }) {
  return variant === "filled" ? <FilledIcon {...props} /> : <OutlineIcon {...props} />;
}`;
  }

  const primary = { key, name: componentName, body, svg: defaultSvg, filledSvg: hasVariants ? filledSvg : undefined };
  if (filledSvg === undefined) {
    return [primary];
  }

  // La entrada fija permite incluir únicamente el relleno en el código compilado.
  const name = componentName + "Filled";
  const filledBody = await transform(filledSvg, componentOptions, { componentName: name });

  return [primary, { key: "filled/" + key, name, body: filledBody, svg: filledSvg }];
}

// El catálogo y el índice React comparten el manifiesto de autoría y se generan en la misma pasada.
const manifest = JSON.parse(await readFile(sourceUrl, "utf8"));
const ids = new Set();
const componentNames = new Set();
const entries = [];
const components = [];

for (const { componentName, ...asset } of manifest.entries) {
  const validId = /^icons\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset.id);
  const validComponentName = /^[A-Z][A-Za-z0-9]*$/.test(componentName);
  if (!validId || !validComponentName || ids.has(asset.id) || componentNames.has(componentName)) {
    throw new Error(`Invalid or duplicate icon identity: ${asset.id} (${componentName})`);
  }

  ids.add(asset.id);
  componentNames.add(componentName);

  entries.push(asset);
  components.push(...await buildIconComponents(asset, componentName));
}

await writeGeneratedFiles({ schemaVersion: manifest.schemaVersion, entries }, components);
await writeWebAdapters(components);
