import { FrameworkLogo } from "../lib/framework-code";
import type { DocsFramework } from "./frameworks";

/** Acompaña el nombre de cada opción con la marca de su tecnología. */
export function FrameworkLabel({ id, label }: Pick<DocsFramework, "id" | "label">) {
  const logo = id === "web" ? "javascript" : id === "sveltekit" ? "svelte" : id;

  return (
    <span className="docs-framework-name">
      <FrameworkLogo id={logo} />
      <span>{label}</span>
    </span>
  );
}
