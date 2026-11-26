import { copyFile, mkdir, rm } from "node:fs/promises";
import { catalogue } from "@grausvera/unancha/catalogue";

const previews = new URL("../public/previews/", import.meta.url);

// Las rutas del catálogo conservan la revisión. Cada URL pública muestra el SVG exacto de esa revisión.
await rm(previews, { recursive: true, force: true });
await mkdir(previews, { recursive: true });

for (const asset of catalogue.entries) {
  for (const revision of asset.variants) {
    const source = import.meta.resolve(`@grausvera/unancha/assets/${revision.path}`);
    const destination = new URL(revision.path, previews);

    await mkdir(new URL("./", destination), { recursive: true });
    await copyFile(new URL(source), destination);
  }
}
