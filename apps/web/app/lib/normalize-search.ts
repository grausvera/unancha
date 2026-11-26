/** Normaliza el texto de búsqueda sin distinguir tildes ni mayúsculas. */
export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es").trim();
}
