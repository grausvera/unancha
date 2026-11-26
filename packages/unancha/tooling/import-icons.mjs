import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getIconAssetPath, readSvgMetadata } from "./svg-metadata.mjs";

const [libraryPath, ...selections] = process.argv.slice(2);

if (!libraryPath || selections.length === 0) {
  throw new Error("Usage: pnpm import:icons <library-directory> <icons/id=Component> [...]");
}

const manifestUrl = new URL("../catalogue.source.json", import.meta.url);
const pendingUrl = new URL("../catalogue.source.json.pending", import.meta.url);
const lockUrl = new URL("../catalogue.source.json.import-lock", import.meta.url);
const assetsUrl = new URL("../assets/", import.meta.url);
const library = JSON.parse(await readFile(resolve(libraryPath, "catalogue.json"), "utf8"));
const materialById = new Map();

for (const entry of library.entries) {
  materialById.set(entry.id, entry);
}

/** Actualiza los metadatos en memoria y devuelve el SVG pendiente si hay una revisión nueva. */
function prepareRevision(manifest, { asset, outline, componentName, bytes }) {
  const existing = manifest.entries.find((entry) => entry.id === asset.id);

  // Un nombre React ya distribuido identifica el mismo icono en todas sus revisiones.
  const usedByAnotherIcon = manifest.entries.some((entry) => {
    return entry.id !== asset.id && entry.componentName === componentName;
  });
  const changesExistingName = existing && existing.componentName !== componentName;
  if (usedByAnotherIcon || changesExistingName) {
    throw new Error(`Conflicting component name: ${asset.id} (${componentName})`);
  }

  const entry = existing ?? {
    id: asset.id,
    kind: "icon",
    label: asset.label,
    group: asset.group,
    keywords: [],
    defaultVariant: "outline",
    componentName,
    variants: [],
  };

  if (!existing) {
    manifest.entries.push(entry);
  }

  // Las etiquetas y palabras clave pueden actualizarse sin crear una revisión del SVG.
  entry.label = asset.label;
  entry.group = asset.group;
  entry.keywords = [...new Set(asset.keywords.map((keyword) => keyword.toLowerCase()))];

  const metadata = {
    sha256: outline.sha256,
    viewBox: asset.viewBox,
    license: "MIT",
    source: `material/unancha/library/${outline.source}`,
  };

  // Los sólidos y otros estilos tienen su propia secuencia de revisiones.
  let latestOutline;

  for (const variant of entry.variants) {
    if (variant.name === "outline" && variant.revision > (latestOutline?.revision ?? 0)) {
      latestOutline = variant;
    }
  }

  const sameRevision = latestOutline && Object.entries(metadata).every(([key, value]) => {
    return latestOutline[key] === value;
  });
  if (sameRevision) {
    return undefined;
  }

  const revision = (latestOutline?.revision ?? 0) + 1;
  const path = getIconAssetPath(asset.id, "outline", revision);
  entry.variants.push({ name: "outline", revision, ...metadata, path });

  return { path, bytes };
}

// Este flujo trabaja con contornos propios. Los símbolos de marca requieren su procedencia y condiciones específicas.
const selectedIcons = [];

for (const selection of selections) {
  const match = /^(icons\/[a-z0-9]+(?:-[a-z0-9]+)*)=([A-Z][A-Za-z0-9]*)$/.exec(selection);
  if (!match) {
    throw new Error(`Invalid icon selection: ${selection}`);
  }

  const [, id, componentName] = match;
  const asset = materialById.get(id);
  const outline = asset?.files.outline;
  const key = id.slice("icons/".length);
  const expectedPath = `icons/outline/${key}.svg`;
  if (asset?.origin !== "original-vector" || outline?.path !== expectedPath || !outline.source) {
    throw new Error(`Original outline with provenance not found: ${id}`);
  }

  const bytes = await readFile(resolve(libraryPath, expectedPath));
  const { sha256, viewBox } = readSvgMetadata(bytes);

  if (sha256 !== outline.sha256 || viewBox !== asset.viewBox) {
    throw new Error(`Material catalogue does not match SVG: ${id}`);
  }

  selectedIcons.push({ asset, outline, componentName, bytes });
}

// Serializa las escrituras al manifiesto y prepara el catálogo completo antes de reemplazarlo.
await writeFile(lockUrl, "", { flag: "wx" });

try {
  const original = await readFile(manifestUrl, "utf8");
  const manifest = JSON.parse(original);
  const pendingFiles = [];

  for (const icon of selectedIcons) {
    const newRevision = prepareRevision(manifest, icon);
    if (newRevision) {
      pendingFiles.push(newRevision);
    }
  }

  // Escribe los SVG antes de publicar el manifiesto que referencia sus rutas.
  for (const { path, bytes } of pendingFiles) {
    const destination = new URL(path, assetsUrl);

    await mkdir(new URL("./", destination), { recursive: true });

    // Una reanudación puede encontrar la misma copia tras una interrupción anterior.
    try {
      await writeFile(destination, bytes, { flag: "wx" });
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }

      const existingBytes = await readFile(destination);
      if (!existingBytes.equals(bytes)) {
        throw error;
      }
    }
  }

  const updated = JSON.stringify(manifest, null, 2) + "\n";
  if (updated !== original) {
    await writeFile(pendingUrl, updated);
    await rename(pendingUrl, manifestUrl);
  }

  console.log(`Imported ${pendingFiles.length} outline revisions from ${selections.length} selections.`);
} finally {
  await rm(pendingUrl, { force: true });
  await rm(lockUrl, { force: true });
}
