import { FrameworkLogo, frameworkOptions, type CodeTab } from "../lib/framework-code";
import { highlightCode } from "../lib/syntax-highlight";
import { navigateTabs } from "../lib/tab-keyboard";

type IntegrationCodeProps = {
  tab: CodeTab;
  onTabChange: (tab: CodeTab) => void;
  code: string;
};

/** Presenta las pestañas con navegación por teclado y el código de la opción activa. */
export function IntegrationCode({ tab, onTabChange, code }: IntegrationCodeProps) {
  return (
    <>
      <div className="detail-framework-grid" role="tablist" onKeyDown={navigateTabs} aria-label="Tecnología o formato">
        {frameworkOptions.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            className="detail-framework-btn"
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            title={label}
            aria-label={label}
            onClick={() => onTabChange(id)}
          >
            <FrameworkLogo id={id} />
          </button>
        ))}
      </div>
      <pre className="detail-code-block">
        <code>{highlightCode(code)}</code>
      </pre>
    </>
  );
}
