import { mkdir, writeFile } from "node:fs/promises";
import { DOMParser, XMLSerializer } from "@xmldom/xmldom";

const sourceUrl = new URL("../src/generated/", import.meta.url);
const distUrl = new URL("../dist/", import.meta.url);
const generatedHeader = "// Archivo generado desde el catálogo y los SVG de Unancha.\n";
const svgNamespace = "http://www.w3.org/2000/svg";
const parser = new DOMParser({
  /** Detiene la generación cuando el dibujo no se puede reproducir como SVG válido. */
  onError(level, message) {
    throw new Error(`Invalid icon SVG (${level}): ${message}`);
  },
});
const serializer = new XMLSerializer();

/** Convierte un elemento SVG en datos que se pueden renderizar en el DOM o en Vue. */
function readNode(element) {
  const attributes = Object.fromEntries(
    Array.from(element.attributes, ({ name, value }) => [name, value]),
  );
  const children = Array.from(element.childNodes)
    .filter((child) => child.nodeType === 1)
    .map(readNode);

  return { tag: element.tagName, attributes, children };
}

/** Separa la raíz de la geometría y aplica los defaults compartidos por los adaptadores. */
function readDrawing(svg) {
  const root = parser.parseFromString(svg, "image/svg+xml").documentElement;

  if (root.localName !== "svg" || root.namespaceURI !== svgNamespace) {
    throw new Error("Expected an SVG document");
  }

  const body = Array.from(root.childNodes)
    .map((child) => serializer.serializeToString(child).replaceAll(` xmlns="${svgNamespace}"`, ""))
    .join("").trim();
  const icon = readNode(root);
  Object.assign(icon.attributes, { width: "1em", height: "1em", "aria-hidden": "true", focusable: "false" });

  return { icon, body };
}

/** Escribe el índice y los archivos públicos de un adaptador, incluidos los accesos por icono. */
async function writeAdapter(base, components, { entry, extension, render, types }) {
  await mkdir(new URL("icons/filled/", base), { recursive: true });

  const exports = [];
  const declarations = [];
  for (const component of components) {
    const { key, name } = component;
    await writeFile(new URL(`icons/${key}.${extension}`, base), render(component));
    exports.push(`export { default as ${name} } from "./icons/${key}.${entry}";`);

    if (types) {
      await writeFile(new URL(`icons/${key}.d.ts`, base), types);
      declarations.push(`export { default as ${name} } from "./icons/${key}.js";`);
    }
  }

  const index = extension === "ts" ? "index.ts" : "index.js";
  await writeFile(new URL(index, base), `${generatedHeader}${exports.join("\n")}\n`);
  if (types) {
    await writeFile(new URL("index.d.ts", base), `${generatedHeader}${declarations.join("\n")}\n`);
  }
}

/** Escribe todos los adaptadores a partir de las mismas variantes seleccionadas para React. */
export async function writeWebAdapters(components) {
  const drawings = components.map(({ key, name, svg, filledSvg }) => ({
    key, name, ...readDrawing(svg), filled: filledSvg ? readDrawing(filledSvg) : undefined,
  }));

  await writeAdapter(new URL("web/", sourceUrl), drawings, {
    entry: "js",
    extension: "ts",
    /** Publica datos estáticos con un módulo independiente por icono. */
    render({ key, icon, filled }) {
      const parent = key.startsWith("filled/") ? "../../../../" : "../../../";
      const filledImport = filled ? `\nimport filled from "./filled/${key}.js";` : "";
      const data = JSON.stringify(icon, null, 2);
      const definition = filled ? data.replace(/\n}$/, ",\n  filled\n}") : data;
      return `${generatedHeader}import type { IconDefinition } from "${parent}web/index.js";${filledImport}\n\nconst icon: IconDefinition = ${definition};\n\nexport default icon;\n`;
    },
  });

  await writeAdapter(new URL("vue/", sourceUrl), drawings, {
    entry: "js",
    extension: "ts",
    /** Mapea cada icono al componente funcional de Vue mediante una importación estática. */
    render({ key, name }) {
      const filled = key.startsWith("filled/");
      const source = filled ? "../../../" : "../../";
      const generated = filled ? "../../../../" : "../../../";
      return `${generatedHeader}import icon from "${source}web/icons/${key}.js";\nimport { createVueIcon } from "${generated}vue/create-icon.js";\n\nexport default /* @__PURE__ */ createVueIcon("${name}", icon);\n`;
    },
  });

  await writeAdapter(new URL("svelte/", distUrl), drawings, {
    entry: "svelte",
    extension: "svelte",
    /** Deja la compilación al consumidor para usar el mismo runtime Svelte que la aplicación. */
    render({ key, icon, body, filled }) {
      const attributes = JSON.stringify(icon.attributes, null, 2);
      const variantImport = filled ? `\n  import FilledIcon from "./filled/${key}.svelte";` : "";
      const drawing = `<svg {...defaults} {...attributes}>\n  ${body}\n</svg>`;
      return `<script lang="ts">
  import type { SVGAttributes } from "svelte/elements";${variantImport}

  let { variant, ...attributes }: SVGAttributes<SVGSVGElement> & { variant?: "line" | "filled" } = $props();
  const defaults = ${attributes};
</script>

${filled ? `{#if variant === "filled"}\n  <FilledIcon {...attributes} />\n{:else}\n  ${drawing}\n{/if}` : drawing}
`;
    },
    types: `${generatedHeader}import type { Component } from "svelte";\nimport type { SVGAttributes } from "svelte/elements";\n\ndeclare const icon: Component<SVGAttributes<SVGSVGElement> & { variant?: "line" | "filled" }>;\nexport default icon;\n`,
  });

  await writeAdapter(new URL("astro/", distUrl), drawings, {
    entry: "astro",
    extension: "astro",
    /** Distribuye componentes Astro que renderizan SVG en el servidor sin hidratarlo. */
    render({ key, icon, body, filled }) {
      const attributes = JSON.stringify(icon.attributes, null, 2);
      const variantImport = filled ? `\nimport FilledIcon from "./filled/${key}.astro";` : "";
      const drawing = `<svg {...{ ...defaults, ...attributes }}>\n  ${body}\n</svg>`;
      return `---
import type { HTMLAttributes } from "astro/types";${variantImport}

type Props = HTMLAttributes<"svg"> & { variant?: "line" | "filled" };
const { variant, ...attributes } = Astro.props;
const defaults = ${attributes};
---

${filled ? `{variant === "filled" ? <FilledIcon {...attributes} /> : (${drawing})}` : drawing}
`;
    },
    types: `${generatedHeader}import type { AstroComponentFactory } from "astro/runtime/server/index.js";\nimport type { HTMLAttributes } from "astro/types";\n\ndeclare const icon: AstroComponentFactory & ((props: HTMLAttributes<"svg"> & { variant?: "line" | "filled" }) => ReturnType<AstroComponentFactory>);\nexport default icon;\n`,
  });

  await writeAdapter(new URL("angular/", sourceUrl), drawings, {
    entry: "js",
    extension: "ts",
    /** Compone sobre el SVG del consumidor y conserva el namespace de cada nodo interior. */
    render({ name, icon, body, filled }) {
      const drawing = filled ? `@if (variant === "filled") { ${filled.body} } @else { ${body} }` : body;
      const template = drawing.replace(/<(\/?)([a-zA-Z][\w-]*)(?=[\s/>])/g, "<$1svg:$2");
      const host = { ...icon.attributes };

      if (filled) {
        for (const attribute of new Set([...Object.keys(host), ...Object.keys(filled.icon.attributes)])) {
          const lineValue = host[attribute];
          const filledValue = filled.icon.attributes[attribute];
          if (lineValue !== filledValue) {
            delete host[attribute];
            host[`[attr.${attribute}]`] = `variant === "filled" ? ${JSON.stringify(filledValue ?? null)} : ${JSON.stringify(lineValue ?? null)}`;
          }
        }
      }

      const input = filled ? '\n  @angular.Input() variant: "line" | "filled" = "line";\n' : "";
      return `${generatedHeader}import * as angular from "@angular/core";\n\n/** Inserta la geometría de ${name} en el SVG anfitrión. */\n@angular.Component({
  selector: "svg[unancha${name}]",
  standalone: true,
  changeDetection: angular.ChangeDetectionStrategy.OnPush,
  host: ${JSON.stringify(host, null, 2)},
  template: ${JSON.stringify(template)},
})
export default class ${name} {${input}}
`;
    },
  });
}
