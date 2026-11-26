import { CodeXml } from "@grausvera/unancha/icons";
import { iconAppearanceAttributes, iconMotionClass, svgDataUrl, type IconAppearance } from "./icon-appearance";
import { prepareStandaloneSvg } from "./svg-export";

export type CodeTab = "react" | "nextjs" | "vue" | "svelte" | "astro" | "angular" | "web" | "svg" | "datauri";

export const frameworkOptions: { id: CodeTab; label: string }[] = [
  { id: "react", label: "React" },
  { id: "nextjs", label: "Next.js" },
  { id: "vue", label: "Vue y Nuxt" },
  { id: "svelte", label: "Svelte y SvelteKit" },
  { id: "astro", label: "Astro" },
  { id: "angular", label: "Angular" },
  { id: "web", label: "JavaScript" },
  { id: "svg", label: "SVG" },
  { id: "datauri", label: "URI de datos" },
];

/** Renderiza el logotipo a color de cada tecnología para el selector de código. */
export function FrameworkLogo({ id }: { id: CodeTab | "nuxt" | "javascript" }) {
  switch (id) {
    case "react":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="2.1" fill="#61DAFB" />
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="#61DAFB" strokeWidth="1.4" transform="rotate(120 12 12)" />
        </svg>
      );
    case "nextjs":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" fill="#ffffff" />
          <path d="M9 8.5v7M9 8.5l7.2 9.2M15 8.5v4.5" stroke="#09090b" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "vue":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2 4h4l6 10.4L18 4h4L12 21 2 4Z" fill="#41B883" />
          <path d="M6 4h3.6L12 8.2 14.4 4H18l-6 10.4L6 4Z" fill="#35495E" />
        </svg>
      );
    case "nuxt":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M2 18 9 6l7 12H2Zm11-5.2 3.2-5.5L22 18h-6" stroke="#00DC82" strokeWidth="2.1" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case "svelte":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18.6 5.4a5.2 5.2 0 0 0-7.2-1.2L6.6 7.3a4.8 4.8 0 0 0-1.9 5.5 4.6 4.6 0 0 0-.7 4.9 5.2 5.2 0 0 0 7.2 1.9l4.8-3.1a4.8 4.8 0 0 0 1.9-5.5 4.6 4.6 0 0 0 .7-5.6Z" fill="#FF3E00" />
          <path d="M10.2 16.6a2.4 2.4 0 0 1-3.3-.8 2.2 2.2 0 0 1 .4-2.6l.5-.4-.1.7a2.8 2.8 0 0 0 1.3 2.7l3.2 2.1-2-1.7Zm3.6-9.2a2.4 2.4 0 0 1 3.3.8 2.2 2.2 0 0 1-.4 2.6l-.5.4.1-.7a2.8 2.8 0 0 0-1.3-2.7L11.8 5.7l2 1.7Z" fill="#ffffff" />
        </svg>
      );
    case "astro":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 17 9.8 3.5h4.4L20 17l-4.5-1.6L12 7l-3.5 8.4L4 17Z" fill="currentColor" />
          <path d="M9 17c1.5 1.2 4.5 1.2 6 0 0 3-1.5 4.5-3 5-1.5-.5-3-2-3-5Z" fill="#FF5D01" />
        </svg>
      );
    case "angular":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 2 3 5.2l1.4 11.8L12 22l7.6-5L21 5.2 12 2Z" fill="#DD0031" />
          <path d="M12 2v20l7.6-5L21 5.2 12 2Z" fill="#C3002F" />
          <path d="M12 5.5 7.4 16h1.8l.9-2.2h3.8l.9 2.2h1.8L12 5.5Zm1.2 6.7h-2.4L12 9.2l1.2 3Z" fill="#ffffff" />
        </svg>
      );
    case "web":
      return <CodeXml />;
    case "javascript":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="1" y="1" width="22" height="22" rx="1.5" fill="#F7DF1E" />
          <path d="M11 10.5v7a2.8 2.8 0 0 1-5.2 1.4m14-7.4a3 3 0 0 0-3.4-.8c-1.5.6-1.5 2.3-.1 3.1l2.4 1.2c1.6.8 1.5 3-.1 3.8a3.6 3.6 0 0 1-4.3-.9" stroke="#171717" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "svg":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="3.5" width="19" height="17" rx="3.5" fill="#F59E0B" />
          <text x="12" y="15" textAnchor="middle" fill="#09090b" fontSize="7.5" fontWeight="800" fontFamily="monospace">SVG</text>
        </svg>
      );
    case "datauri":
      return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="3.5" width="19" height="17" rx="3.5" fill="#38BDF8" />
          <text x="12" y="15" textAnchor="middle" fill="#09090b" fontSize="7" fontWeight="800" fontFamily="monospace">URI</text>
        </svg>
      );
  }
}

/** Construye el fragmento de código para el framework o formato seleccionado. */
export function buildFrameworkSnippet({
  tab,
  componentName,
  src,
  label,
  size,
  color,
  svgSource,
  variant,
  appearance,
  outline,
}: {
  tab: CodeTab;
  componentName?: string;
  src: string;
  label: string;
  size: number;
  color?: string;
  svgSource: string;
  variant?: "line" | "filled";
  appearance: IconAppearance;
  outline: boolean;
}): string {
  if (tab === "svg" || tab === "datauri") {
    const prepared = svgSource ? prepareStandaloneSvg(svgSource, color, size, { appearance, outline }) : "";
    return tab === "svg"
      ? prepared || "Cargando código SVG…"
      : prepared ? svgDataUrl(prepared) : "Cargando URI de datos…";
  }

  if (!componentName) {
    const drawing = svgSource ? svgDataUrl(prepareStandaloneSvg(svgSource, color, size, { appearance, outline })) : src;
    return `<img src="${drawing}" width="${size}" height="${size}" alt="${htmlValue(appearance.label.trim() || label)}" />`;
  }

  const attributes: Record<string, string | number> = {
    ...(variant ? { variant } : {}),
    width: size,
    height: size,
    ...(color ? { color } : {}),
    ...iconAppearanceAttributes(appearance, outline),
  };
  const className = iconMotionClass(appearance);
  const style = appearance.rotation ? `rotate: ${appearance.rotation}deg; transform-origin: center` : "";
  const componentImport = `import { ${componentName} } from "@grausvera/unancha/icons";`;
  const setup = tab === "vue"
    ? "// Configura unancha-vue en Vite o el alias de Unancha en Nuxt."
    : `// Agrega la condición unancha-${tab} en la configuración del proyecto.`;
  const motionSetup = className ? '// En tu CSS global: @import "@grausvera/unancha/motion.css";\n' : "";
  const adapterImport = `${setup}\n${motionSetup}${componentImport}`;

  const react = tab === "react" || tab === "nextjs";
  const markup = Object.entries(attributes).map(([name, value]) => {
    const prop = react ? reactAttributes[name] ?? name : name;
    return react && typeof value === "number" ? `${prop}={${value}}` : `${prop}="${htmlValue(value)}"`;
  });
  if (className) {
    markup.push(`${react ? "className" : "class"}="${className}"`);
  }
  if (style) {
    markup.push(react ? `style={{ rotate: "${appearance.rotation}deg", transformOrigin: "center" }}` : `style="${style}"`);
  }
  const element = `<${componentName} ${markup.join(" ")} />`;

  switch (tab) {
    case "react":
      return `${motionSetup}${componentImport}\n\n${element}`;
    case "nextjs":
      return `${motionSetup}${componentImport}\n\nexport function Icon() {\n  return ${element};\n}`;
    case "vue":
      return `<script setup>\n${adapterImport}\n</script>\n\n<template>\n  ${element}\n</template>`;
    case "svelte":
      return `<script>\n${adapterImport}\n</script>\n\n${element}`;
    case "astro":
      return `---\n${adapterImport}\n---\n\n${element}`;
    case "angular": {
      const bindings = Object.entries(attributes).map(([name, value]) => name === "variant"
        ? `[variant]="${htmlValue(JSON.stringify(value))}"`
        : `[attr.${name}]="${htmlValue(JSON.stringify(value))}"`);
      if (className) {
        bindings.push(`class="${className}"`);
      }
      if (style) {
        bindings.push(`style="${style}"`);
      }
      const template = `<svg unancha${componentName} ${bindings.join(" ")}></svg>`;
      return `import { Component as AngularComponent } from "@angular/core";\n${adapterImport}\n\n@AngularComponent({\n  selector: "app-icon",\n  standalone: true,\n  imports: [${componentName}],\n  template: ${JSON.stringify(template)},\n})\nexport class IconComponent {}`;
    }
    case "web": {
      const options = { ...attributes, ...(className ? { class: className } : {}), ...(style ? { style } : {}) };
      const entries = Object.entries(options).map(([name, value]) =>
        `  ${/^[a-z]+$/i.test(name) ? name : JSON.stringify(name)}: ${JSON.stringify(value)}`,
      );
      return `${setup}\n${motionSetup}import { createIcon, ${componentName} } from "@grausvera/unancha/icons";\n\ndocument.body.append(createIcon(${componentName}, {\n${entries.join(",\n")}\n}));`;
    }
  }
}

const reactAttributes: Record<string, string> = { "stroke-linecap": "strokeLinecap" };

/** Escapa el texto que se inserta en atributos de los fragmentos HTML o JSX. */
function htmlValue(value: string | number) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")
    .replaceAll("{", "&#123;").replaceAll("}", "&#125;");
}
