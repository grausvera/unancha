export type HsvColor = [hue: number, saturation: number, value: number];

/** Convierte coordenadas HSV (h: 0-360, s: 0-100, v: 0-100) a hexadecimal #rrggbb. */
export function hsvToHex(h: number, s: number, v: number) {
  const sn = s / 100;
  const vn = v / 100;
  const c = vn * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vn - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  /** Aplica el nivel base a un canal y lo codifica con dos dígitos. */
  function toHex(channel: number) {
    return Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0");
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** Convierte un código hexadecimal #rrggbb válido a HSV. */
export function hexToHsv(hex: string, fallbackValue = 96): HsvColor {
  const clean = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(clean)) {
    return [0, 0, fallbackValue];
  }

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60;
    } else {
      h = ((r - g) / d + 4) * 60;
    }
  }

  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  return [Math.round(h), Math.round(s), Math.round(v)];
}
