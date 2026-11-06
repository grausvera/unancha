import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { catalogue, getAsset } from "@grausvera/unancha";

assert.equal(catalogue.length, 10);
assert.equal(getAsset("icons/sun").name, "Sol");
assert.equal(getAsset("missing"), null);
await access(
  new URL(
    "./node_modules/@grausvera/unancha/assets/icons/sun.svg",
    import.meta.url,
  ),
);
console.log("Installed package passed");
