export type ExplorerVariant = {
  name: string;
  label: string;
  revision: number;
  src: string;
  href: string;
  downloadName: string;
  sha256: string;
  componentName?: string;
};

export type ExplorerItem = {
  id: string;
  slug: string;
  label: string;
  group: string;
  groupLabel: string;
  keywords: readonly string[];
  line?: ExplorerVariant;
  filled?: ExplorerVariant;
};

export type ExplorerGroup = {
  id: string;
  label: string;
  count: number;
};

/** Resuelve la variante pedida y conserva el icono si solo existe una variante. */
export function getExplorerVariant(item: ExplorerItem, filled: boolean) {
  return filled ? (item.filled ?? item.line) : (item.line ?? item.filled);
}
