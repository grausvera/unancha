import type { ReactNode } from "react";

const cssTokens = /(?<comment>\/\*[\s\S]*?\*\/)|(?<str>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(?<tag>[.#][a-z_][\w-]*(?=[^{};\n]*\{))|(?<property>(?:--)?[a-z_-][\w-]*(?=\s*:))|(?<fn>[a-z_-][\w-]*(?=\())|(?<value>#[\da-f]{3,8}\b|-?(?:\d*\.\d+|\d+)(?:[a-z]+|%)?|[a-z_-][\w-]*)|(?<punct>[{}():;,/])/gi;
const markupTokens = /(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|(?<str>"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`|^data:[^\s]+)|(?<kw>\b(?:import|from|export|function|return|const|let|default|if|else|undefined|true|false)\b)|(?<tag><\/?[A-Za-z][A-Za-z0-9-]*)|(?<attr>\b[a-zA-Z-]+(?=\s*=))|(?<fn>\$?[a-zA-Z_][\w$]*(?=\())|(?<value>\b\d+(?:\.\d+)?\b)|(?<punct>\/>|[>{}()[\],;=:])/g;
const shellTokens = /(?<command>^[\w-]+)|(?<package>@[\w.-]+\/[\w.-]+)|(?<action>\b(?:install|add)\b)/gm;
const languageTokens = { css: cssTokens, markup: markupTokens, shell: shellTokens };

/** Pinta el código con One Dark Pro y conserva exactamente el texto original. */
export function highlightCode(code: string, language: keyof typeof languageTokens = "markup"): ReactNode {
  const tokens: ReactNode[] = [];
  let end = 0;

  for (const match of code.matchAll(languageTokens[language])) {
    const start = match.index;
    const kind = Object.entries(match.groups ?? {}).find(([, content]) => content !== undefined)?.[0];

    tokens.push(code.slice(end, start));
    tokens.push(<span key={start} className={kind ? `tok-${kind}` : undefined}>{match[0]}</span>);
    end = start + match[0].length;
  }

  tokens.push(code.slice(end));

  return tokens;
}
