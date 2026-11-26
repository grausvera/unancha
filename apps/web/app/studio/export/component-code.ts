export type ComponentFormat = "react" | "vue" | "svelte";

type BadgeComponentOptions = {
  format: ComponentFormat;
  name: string;
  asset: string;
  reactModule?: string;
  background: string;
  size: number;
  iconSize: number;
  iconColor: string;
  iconStops: readonly { color: string; pos: number }[];
};

/** Genera un atributo dinámico con la sintaxis del componente de destino. */
function bindAttribute(format: ComponentFormat, name: string, expression: string) {
  return format === "vue" ? `:${name}="${expression}"` : `${name}={${expression}}`;
}

/** Aísla los degradados del contenedor y usa los nombres SVG que espera JSX. */
function bindBackground(format: ComponentFormat, markup: string) {
  const content = markup
    .replace('id="unancha-bg-grad"', bindAttribute(format, "id", "id + '-background'"))
    .replace('fill="url(#unancha-bg-grad)"', bindAttribute(format, "fill", "'url(#' + id + '-background)'"));

  if (format !== "react") {
    return content;
  }

  return content.replace(/\b((?:stop|stroke)(?:-[a-z]+)+)=/g, (_match, name: string) =>
    name.replace(/-([a-z])/g, (_part, letter: string) => letter.toUpperCase()) + "=",
  );
}

/** Genera un componente que importa el icono de Unancha y conserva la geometría de Studio. */
export function buildBadgeComponent(options: BadgeComponentOptions) {
  const { format, name, asset, reactModule, background, size, iconSize, iconColor, iconStops } = options;
  const reactIcon = format === "react" && Boolean(reactModule);
  const needsMask = !reactIcon || iconStops.length > 0;
  const needsId = needsMask || background.includes("unancha-bg-grad");
  const offset = (size - iconSize) / 2;
  const position = `x="${offset}" y="${offset}" width="${iconSize}" height="${iconSize}"`;
  const iconImport = reactIcon
    ? `import UnanchaIcon from ${JSON.stringify(reactModule)};`
    : `import iconUrl from ${JSON.stringify(asset + "?no-inline")};`;
  const drawing = reactIcon
    ? `<UnanchaIcon ${position} color="${needsMask ? "#fff" : iconColor}" />`
    : `<image ${position} ${bindAttribute(format, "href", "iconUrl")} />`;
  const content = [bindBackground(format, background)].filter(Boolean);

  if (needsMask) {
    const maskType = format === "react" ? 'style={{ maskType: "alpha" }}' : 'style="mask-type: alpha"';
    const gradientId = bindAttribute(format, "id", "id + '-ink'");
    const stops = iconStops.map(({ pos, color }) => {
      const stopColor = format === "react" ? "stopColor" : "stop-color";

      return `      <stop offset="${pos}%" ${stopColor}="${color}" />`;
    }).join("\n");
    const gradient = stops
      ? `\n    <linearGradient ${gradientId} x2="100%" y2="100%">\n${stops}\n    </linearGradient>`
      : "";
    const fill = stops ? bindAttribute(format, "fill", "'url(#' + id + '-ink)'") : `fill="${iconColor}"`;
    content.push(
      `<defs>
    <mask ${bindAttribute(format, "id", "id + '-icon'")} maskUnits="userSpaceOnUse" x="0" y="0" width="${size}" height="${size}" ${maskType}>
      ${drawing}
    </mask>${gradient}
  </defs>`,
      `<rect ${position} ${fill} ${bindAttribute(format, "mask", "'url(#' + id + '-icon)'")} />`,
    );
  } else {
    content.push(drawing);
  }

  const rest = format === "vue" ? "" : " {...attributes}";
  const svg = `<svg${rest} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"
  ${bindAttribute(format, "width", "size")} ${bindAttribute(format, "height", "size")}
  ${bindAttribute(format, "role", "alt ? 'img' : undefined")}
  ${bindAttribute(format, "aria-label", "alt || undefined")}
  ${bindAttribute(format, "aria-hidden", "alt ? undefined : true")}>
  ${content.join("\n  ")}
</svg>`;

  if (format === "react") {
    const imports = needsId ? `import { useId } from "react";\n${iconImport}` : iconImport;
    const setup = needsId ? "  const id = useId();\n" : "";

    return `${imports}

export function ${name}({ size = ${size}, alt = "", ...attributes } = {}) {
${setup}  return (
    ${svg.replace(/\n/g, "\n    ")}
  );
}`;
  }

  if (format === "vue") {
    return `<script setup>
import { useId } from "vue";
${iconImport}

defineProps({
  size: { type: Number, default: ${size} },
  alt: { type: String, default: "" },
});

const id = useId();
</script>

<template>
  ${svg.replace(/\n/g, "\n  ")}
</template>`;
  }

  return `<script>
  ${iconImport}

  let { size = ${size}, alt = "", ...attributes } = $props();
  const id = $props.id();
</script>

${svg}`;
}
