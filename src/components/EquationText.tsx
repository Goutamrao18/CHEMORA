import React, { useState, useEffect, useMemo } from 'react';

interface EquationTextProps {
  content: string;
  className?: string;
}

// Global cached module references so KaTeX is imported at most once across all components
let katexModule: any = null;
let domPurifyModule: any = null;
let loadPromise: Promise<{ katex: any; dompurify: any }> | null = null;

function loadKaTeX(): Promise<{ katex: any; dompurify: any }> {
  if (katexModule && domPurifyModule) {
    return Promise.resolve({ katex: katexModule, dompurify: domPurifyModule });
  }
  if (!loadPromise) {
    loadPromise = Promise.all([
      import('katex'),
      import('dompurify'),
      import('katex/dist/katex.min.css'),
    ]).then(([k, d]) => {
      katexModule = k.default || k;
      domPurifyModule = d.default || d;
      return { katex: katexModule, dompurify: domPurifyModule };
    });
  }
  return loadPromise;
}

// Fallback cleaner if KaTeX is loading or encounters non-standard syntax
function cleanLatexFallback(raw: string): string {
  return raw
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\rightarrow/g, ' → ')
    .replace(/\\leftarrow/g, ' ← ')
    .replace(/\\rightleftharpoons/g, ' ⇌ ')
    .replace(/\\times/g, ' × ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\\pm/g, ' ± ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
    .replace(/\\([a-zA-Z]+)/g, '$1')
    .replace(/_\{([^}]+)\}/g, ' $1 ')
    .replace(/\^\{([^}]+)\}/g, '^($1)')
    .replace(/[{}]/g, '')
    .trim();
}

function renderLatex(
  rawEq: string,
  isBlock: boolean,
  katexEngine: any
): { html: string; isError: boolean } {
  if (!katexEngine) {
    return { html: cleanLatexFallback(rawEq), isError: true };
  }
  try {
    const cleanEq = rawEq.trim();
    const html = katexEngine.renderToString(cleanEq, {
      displayMode: isBlock,
      throwOnError: false,
      strict: false,
      output: 'htmlAndMathml',
    });
    return { html, isError: false };
  } catch (err) {
    console.warn('KaTeX render error:', err);
    return { html: cleanLatexFallback(rawEq), isError: true };
  }
}

// Renders markdown formatting (bold, italic, inline code) inside plain text chunks
function renderMarkdownChunk(chunk: string, keyPrefix: string): React.ReactNode[] {
  const parts = chunk.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);

  return parts.map((part, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={key} className="font-bold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={key} className="italic text-slate-300">
          {part.slice(1, -1)}
        </em>
      );
    }

    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-black/50 border border-cyan-900/40 text-cyan-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

const EQ_REGEX = /(\\\[[\s\S]*?\\\]|\$\$[\s\S]*?\$\$|\\\(.+?\\\)|(?:\$(?!\s)(?:[^\$\n]+?)(?<!\s)\$))/g;

export const EquationText: React.FC<EquationTextProps> = React.memo(({ content, className = '' }) => {
  const hasEquations = useMemo(() => {
    if (!content) return false;
    return (
      content.includes('\\[') ||
      content.includes('$$') ||
      content.includes('\\(') ||
      content.includes('$')
    );
  }, [content]);

  const [engineLoaded, setEngineLoaded] = useState<boolean>(() => !!katexModule);

  useEffect(() => {
    if (hasEquations && !engineLoaded) {
      loadKaTeX().then(() => {
        setEngineLoaded(true);
      }).catch((err) => {
        console.warn('Failed to dynamically load KaTeX:', err);
      });
    }
  }, [hasEquations, engineLoaded]);

  const elements = useMemo(() => {
    if (!content) return null;

    const parts = content.split(EQ_REGEX);

    return parts.map((part, index) => {
      if (!part) return null;

      // 1. Block Equation: \[ ... \] or $$ ... $$
      const isSquareBlock = part.startsWith('\\[') && part.endsWith('\\]');
      const isDollarBlock = part.startsWith('$$') && part.endsWith('$$');

      if (isSquareBlock || isDollarBlock) {
        const rawEq = isSquareBlock ? part.slice(2, -2) : part.slice(2, -2);
        const { html, isError } = renderLatex(rawEq, true, katexModule);

        if (isError || !domPurifyModule) {
          return (
            <div
              key={`block-${index}`}
              className="my-3 px-3.5 py-2.5 rounded-xl bg-[#061224] border border-cyan-800/40 text-cyan-200 font-mono text-center text-xs overflow-x-auto shadow-inner"
            >
              {html}
            </div>
          );
        }

        const sanitizedHtml = domPurifyModule.sanitize(html);
        return (
          <div
            key={`block-${index}`}
            className="my-3 px-4 py-3 rounded-2xl bg-[#040e1e]/90 border border-cyan-500/30 overflow-x-auto text-cyan-100 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-200 hover:border-cyan-400/50"
          >
            <div
              className="py-1 text-center font-serif text-sm sm:text-base leading-relaxed tracking-wide text-cyan-100"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </div>
        );
      }

      // 2. Inline Equation: \( ... \) or $ ... $
      const isParenInline = part.startsWith('\\(') && part.endsWith('\\)');
      const isDollarInline = part.startsWith('$') && part.endsWith('$') && part.length > 2;

      if (isParenInline || isDollarInline) {
        const rawEq = isParenInline ? part.slice(2, -2) : part.slice(1, -1);
        const { html, isError } = renderLatex(rawEq, false, katexModule);

        if (isError || !domPurifyModule) {
          return (
            <span
              key={`inline-${index}`}
              className="inline-block px-1.5 py-0.5 mx-0.5 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-200 font-mono text-[11px]"
            >
              {html}
            </span>
          );
        }

        const sanitizedInlineHtml = domPurifyModule.sanitize(html);
        return (
          <span
            key={`inline-${index}`}
            className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded-md bg-cyan-950/50 border border-cyan-500/20 text-cyan-100 font-serif"
            dangerouslySetInnerHTML={{ __html: sanitizedInlineHtml }}
          />
        );
      }

      // 3. Regular Markdown & Plain Text Chunk
      const paragraphs = part.split(/\n\n+/);

      return (
        <React.Fragment key={`text-${index}`}>
          {paragraphs.map((p, pIdx) => {
            const pKey = `p-${index}-${pIdx}`;
            if (!p.trim()) return null;

            const lines = p.split('\n');
            const isBulletList = lines.every((line) => /^\s*([•\-\*]|\d+\.)\s+/.test(line));

            if (isBulletList) {
              return (
                <ul key={pKey} className="my-2 space-y-1.5 pl-4 list-disc list-outside text-slate-200">
                  {lines.map((line, lIdx) => {
                    const cleanLine = line.replace(/^\s*([•\-\*]|\d+\.)\s+/, '');
                    return (
                      <li key={`${pKey}-li-${lIdx}`} className="leading-relaxed">
                        {renderMarkdownChunk(cleanLine, `${pKey}-l-${lIdx}`)}
                      </li>
                    );
                  })}
                </ul>
              );
            }

            return (
              <p key={pKey} className="my-1.5 leading-relaxed">
                {lines.map((line, lIdx) => (
                  <React.Fragment key={`${pKey}-ln-${lIdx}`}>
                    {renderMarkdownChunk(line, `${pKey}-ln-${lIdx}`)}
                    {lIdx < lines.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            );
          })}
        </React.Fragment>
      );
    });
  }, [content, engineLoaded]);

  return <div className={`equation-text-container ${className}`}>{elements}</div>;
});

EquationText.displayName = 'EquationText';
