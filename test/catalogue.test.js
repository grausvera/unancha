import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { catalogue, getAsset } from "../src/index.js";

test("catalogue IDs are unique and resolve to existing SVG files", async () => {
  assert.equal(
    new Set(catalogue.map((asset) => asset.id)).size,
    catalogue.length,
  );
  for (const asset of catalogue) {
    assert.ok(asset.file.endsWith(".svg"));
    await access(new URL("../assets/" + asset.file, import.meta.url));
  }
});

test("unknown IDs return null without substituting another drawing", () => {
  assert.equal(getAsset("icons/sun").name, "Sol");
  for (const id of ["missing", "constructor", "__proto__", null, {}, 42]) {
    assert.equal(getAsset(id), null);
  }
});
