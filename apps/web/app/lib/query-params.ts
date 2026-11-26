type QueryValue = string | string[] | undefined;
export type SearchParams = Record<string, QueryValue>;

/** Interpreta un solo valor por campo incluso si la URL repite el parámetro. */
export function firstParam(value: QueryValue) {
  return Array.isArray(value) ? value[0] : value;
}
