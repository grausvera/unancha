import { h, type FunctionalComponent, type SVGAttributes, type VNode } from "vue";
import type { IconDefinition, IconNode, IconVariant } from "../web/index.js";

type IconProps = SVGAttributes & { variant?: IconVariant };

/** Reproduce la geometría y deja la raíz disponible para atributos y eventos de Vue. */
function renderNode(node: IconNode, attributes: Record<string, unknown>): VNode {
  return h(node.tag, attributes, node.children.map((child) => renderNode(child, child.attributes)));
}

/** Crea un componente funcional con atributos SVG y valores decorativos predeterminados. */
export function createVueIcon(name: string, icon: IconDefinition): FunctionalComponent<IconProps> {
  /** Combina los atributos de la plantilla con los valores del dibujo original. */
  const component: FunctionalComponent<IconProps> = (_props, { attrs }) => {
    const { variant, ...attributes } = attrs;
    const drawing = variant === "filled" ? icon.filled ?? icon : icon;
    return renderNode(drawing, { ...drawing.attributes, ...attributes });
  };

  component.displayName = name;
  component.inheritAttrs = false;
  return component;
}
