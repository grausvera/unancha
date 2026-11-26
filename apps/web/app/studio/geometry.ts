/** Calcula los puntos de un polígono regular o estrella inscrito en un cuadrado de tamaño `size`. */
export function buildPolygonPoints(
  vertices: number,
  size: number,
  starDepth = 0,
  inset = 2,
): Array<[number, number]> {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - inset;
  const rInner = rOuter * (1 - starDepth / 100);
  const total = starDepth > 0 ? vertices * 2 : vertices;
  const points: Array<[number, number]> = [];

  for (let i = 0; i < total; i++) {
    const r = starDepth > 0 && i % 2 === 1 ? rInner : rOuter;
    const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
    points.push([
      Number((cx + r * Math.cos(angle)).toFixed(2)),
      Number((cy + r * Math.sin(angle)).toFixed(2)),
    ]);
  }

  return points;
}

/** Limita el icono al cuadrado central que cabe dentro de la forma, con margen para el trazo. */
export function fitIconSize(size: number, boxSize: number, hasBackground: boolean, cornerRadius: number, vertices: number, starDepth: number, border: number) {
  if (!hasBackground) {
    return Math.min(size, boxSize);
  }

  const padding = Math.max(4, boxSize * .08, border + 2);
  const radius = boxSize * cornerRadius / 100;
  const roundedLimit = boxSize - 2 * Math.max(padding, radius * (1 - Math.SQRT1_2) + 2);
  const polygonLimit = (boxSize / 2 - Math.max(2, border / 2)) * (1 - starDepth / 100) * Math.cos(Math.PI / Math.max(vertices, 3)) * Math.SQRT2 - border - 4;
  const limit = vertices >= 3 ? Math.min(roundedLimit, polygonLimit) : roundedLimit;

  return Math.min(size, Math.max(1, Math.floor(limit)));
}
