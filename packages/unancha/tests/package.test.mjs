import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Sun } from "@grausvera/unancha";
import { catalogue, getAsset, getAssetVersion } from "@grausvera/unancha/catalogue";
import { Sun as CategorySun, SunFilled } from "@grausvera/unancha/icons";
import DirectSun from "@grausvera/unancha/icons/sun";

test("resolves an exact revision and verifies the exported SVG", async () => {
  const reference = {
    assetId: "icons/sun",
    variant: "line",
    revision: 1,
  };
  const version = getAssetVersion(reference);

  assert.equal(catalogue.schemaVersion, 1);
  assert.equal(getAsset(reference.assetId)?.defaultVariant, "line");
  assert.ok(version);

  // La consulta exacta falla si la variante o la revisión pedida está ausente.
  assert.equal(getAssetVersion({ ...reference, variant: "outline" }), undefined);
  assert.equal(getAssetVersion({ ...reference, revision: 2 }), undefined);

  const assetUrl = import.meta.resolve(`@grausvera/unancha/assets/${version.path}`);
  const svg = await readFile(new URL(assetUrl));
  assert.equal(createHash("sha256").update(svg).digest("hex"), version.sha256);
});

test("all three entry points render the same decorative icon by default", () => {
  assert.equal(Sun, CategorySun);
  assert.equal(Sun, DirectSun);

  const html = renderToStaticMarkup(createElement(Sun, { width: 24 }));
  assert.match(html, /viewBox="0 0 24 24"/);
  assert.match(html, /width="24"/);
  assert.match(html, /aria-hidden="true"/);
  assert.match(html, /stroke-width="1.8"/);
  assert.match(html, /<path/);
});

test("selects the same filled drawing with variant and applies SVG attributes", () => {
  const props = { color: "#123456", opacity: 0.6, strokeLinecap: "square", strokeWidth: 2.5 };
  const line = renderToStaticMarkup(createElement(Sun, { variant: "line", ...props }));
  const filled = renderToStaticMarkup(createElement(Sun, { variant: "filled", ...props }));

  assert.match(line, /stroke-width="2.5"/);
  assert.match(line, /stroke-linecap="square"/);
  assert.match(line, /color="#123456"/);
  assert.match(line, /opacity="0.6"/);
  assert.equal(filled, renderToStaticMarkup(createElement(SunFilled, props)));
  assert.doesNotMatch(filled, /\svariant=/);
});
