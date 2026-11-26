// La identidad y la revisión permiten recuperar exactamente el dibujo referenciado.
export type AssetReference = {
  readonly assetId: string;
  readonly variant: string;
  readonly revision: number;
};

// Metadatos del archivo distribuido que corresponde a una revisión concreta.
export type AssetRevision = {
  readonly name: string;
  readonly revision: number;
  readonly sha256: string;
  readonly viewBox: string;
  readonly path: string;
  readonly license: string;
  readonly source: string;
};

// Los datos de exploración pertenecen al recurso y pueden evolucionar entre publicaciones.
export type Asset = {
  readonly id: string;
  readonly kind: "icon";
  readonly label: string;
  readonly group: string;
  readonly keywords: readonly string[];
  readonly defaultVariant: string;
  readonly variants: readonly AssetRevision[];
};

// La versión del esquema identifica el formato del catálogo.
export type Catalogue = {
  readonly schemaVersion: number;
  readonly entries: readonly Asset[];
};
