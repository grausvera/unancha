export { catalogue } from "./catalogue.js";
import { catalogue } from "./catalogue.js";

export function getAsset(id) {
  return catalogue.find((asset) => asset.id === id) ?? null;
}
