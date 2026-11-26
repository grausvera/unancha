import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageDirectory = fileURLToPath(new URL("../", import.meta.url));
const workspaceDirectory = fileURLToPath(new URL("../../../", import.meta.url));
const artifactsDirectory = join(workspaceDirectory, "artifacts");
const packageMetadata = JSON.parse(await readFile(join(packageDirectory, "package.json"), "utf8"));
const version = packageMetadata.version;
const tarballName = `grausvera-unancha-${version}.tgz`;
const releaseDirectory = join(artifactsDirectory, version);
const manifestInTarball = "package/catalogue.source.json";
const execution = { cwd: packageDirectory, stdio: "inherit" };

/** Empaqueta el build actual en un directorio de trabajo sin tocar el candidato final. */
function pack(destination) {
  execFileSync("pnpm", ["pack", "--pack-destination", destination], execution);

  return join(destination, tarballName);
}

/** Compara el catálogo anterior con las revisiones del candidato antes de compilar. */
async function verifyBaseline(baseline, stagingDirectory) {
  const baselineTarball = resolve(workspaceDirectory, baseline);
  const previousManifest = execFileSync("tar", ["-xOf", baselineTarball, manifestInTarball]);
  const previousManifestPath = join(stagingDirectory, "previous.json");

  await writeFile(previousManifestPath, previousManifest);
  execFileSync("pnpm", ["verify:revisions", previousManifestPath], execution);
}

const [baseline] = process.argv.slice(2);

await mkdir(artifactsDirectory, { recursive: true });
const staging = await mkdtemp(join(artifactsDirectory, ".prepare-"));
let reservedRelease = false;

try {
  const candidateDirectory = join(staging, "candidate");
  const repeatDirectory = join(staging, "repeat");

  await mkdir(candidateDirectory);
  await mkdir(repeatDirectory);

  if (baseline) {
    await verifyBaseline(baseline, staging);
  } else {
    console.log("No previous tarball provided for revision comparison.");
  }

  // Las pruebas generan el primer build. El generador limpia sus salidas al repetirlo.
  execFileSync("pnpm", ["test"], execution);
  const candidate = pack(candidateDirectory);

  execFileSync("pnpm", ["build"], execution);
  const repeated = pack(repeatDirectory);

  const candidateBytes = await readFile(candidate);
  const repeatedBytes = await readFile(repeated);
  if (!candidateBytes.equals(repeatedBytes)) {
    throw new Error("Rebuilding changed the tarball bytes.");
  }

  console.log("Both builds produced identical tarballs.");

  execFileSync("pnpm", ["verify:tarball", candidate], execution);

  const checksum = createHash("sha256").update(candidateBytes).digest("hex");

  await writeFile(join(candidateDirectory, "SHA256SUMS"), `${checksum}  ${tarballName}\n`);
  const manifest = execFileSync("tar", ["-xOf", candidate, manifestInTarball]);

  await writeFile(join(candidateDirectory, "catalogue.source.json"), manifest);

  // Reserva la ruta final de forma exclusiva para conservar los candidatos de la misma versión.
  await mkdir(releaseDirectory);
  reservedRelease = true;
  await rename(candidateDirectory, releaseDirectory);
  reservedRelease = false;

  console.log(`Release candidate ready: ${releaseDirectory}`);
} finally {
  if (reservedRelease) {
    await rm(releaseDirectory, { recursive: true, force: true });
  }

  await rm(staging, { recursive: true, force: true });
}
