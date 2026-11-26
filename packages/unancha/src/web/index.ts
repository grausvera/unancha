export * from "../generated/web/index.js";

export type IconAttributes = Readonly<Record<string, string | number | boolean | null | undefined>>;

export interface IconNode {
  readonly tag: string;
  readonly attributes: Readonly<Record<string, string>>;
  readonly children: readonly IconNode[];
}

export type IconVariant = "line" | "filled";

export interface IconDefinition extends IconNode {
  readonly filled?: IconNode;
}

export type IconOptions = IconAttributes & { readonly variant?: IconVariant };

const svgNamespace = "http://www.w3.org/2000/svg";

/** Construye los nodos SVG con el documento indicado y aplica los atributos del icono. */
function createNode(node: IconNode, owner: Document, attributes: IconAttributes): SVGElement {
  const element = owner.createElementNS(svgNamespace, node.tag);

  for (const [name, value] of Object.entries(attributes)) {
    if (value != null && !/^on/i.test(name)) {
      element.setAttribute(name, String(value));
    }
  }

  for (const child of node.children) {
    element.appendChild(createNode(child, owner, child.attributes));
  }

  return element;
}

/** Devuelve un SVG independiente y permite personalizar los atributos de su raíz. */
export function createIcon(icon: IconDefinition, { variant, ...attributes }: IconOptions = {}, owner = document): SVGSVGElement {
  const drawing = variant === "filled" ? icon.filled ?? icon : icon;
  return createNode(drawing, owner, { ...drawing.attributes, ...attributes }) as SVGSVGElement;
}
