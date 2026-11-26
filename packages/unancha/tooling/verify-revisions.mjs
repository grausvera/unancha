import { readFile } from "node:fs/promises";
import { getIconAssetPath } from "./svg-metadata.mjs";

const baselinePath = process.argv[2];
if (!baselinePath) {
  throw new Error("Usage: pnpm verify:revisions <baseline-catalogue.json>");
}

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const currentUrl = new URL("../catalogue.source.json", import.meta.url);
const current = JSON.parse(await readFile(currentUrl, "utf8"));

/** Indexa las revisiones por la identidad que conservarán las composiciones. */
function indexRevisions(catalogue) {
  const revisions = new Map();

  for (const asset of catalogue.entries) {
    for (const variant of asset.variants) {
      const identity = `${asset.id}/${variant.name}/${variant.revision}`;
      revisions.set(identity, variant);
    }
  }

  return revisions;
}

const previousRevisions = indexRevisions(baseline);
const currentRevisions = indexRevisions(current);
// Las etiquetas y los grupos pueden evolucionar. Estos campos describen la revisión distribuida.
const immutableFields = ["sha256", "viewBox", "license", "source"];
const problems = [];

// Reúne todas las diferencias para corregir el candidato en una sola pasada.
for (const [key, previous] of previousRevisions) {
  const candidate = currentRevisions.get(key);
  if (!candidate) {
    problems.push(`Missing revision: ${key}`);
    continue;
  }

  // Acepta únicamente el traslado desde la ruta histórica a la ruta plana canónica.
  const assetId = key.split("/").slice(0, 2).join("/");
  const relocated = previous.path === `${key}.svg`
    && candidate.path === getIconAssetPath(assetId, previous.name, previous.revision);
  if (candidate.path !== previous.path && !relocated) {
    problems.push(`Changed revision: ${key} (path)`);
  }

  for (const field of immutableFields) {
    if (candidate[field] !== previous[field]) {
      problems.push(`Changed revision: ${key} (${field})`);
    }
  }
}

if (problems.length > 0) {
  throw new Error(problems.join("\n"));
}

console.log(`Verified ${previousRevisions.size} existing revisions.`);
