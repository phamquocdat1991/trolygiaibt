import React, { useState } from 'react';
import katex from 'katex';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Function to render LaTeX safely using KaTeX
function renderLatex(tex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(tex.trim(), {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
    });
  } catch (err) {
    return `<span class="text-amber-600 dark:text-amber-400 font-mono">${escapeHtml(tex)}</span>`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none text-[15px] sm:text-[16px] leading-relaxed break-words ${className}`}>
      {renderMarkdownToElements(content)}
    </div>
  );
};

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-3.5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 shadow-xs">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/90 border-b border-slate-700/60 text-xs font-mono text-slate-400">
        <span>{language || 'code'}</span>
        <button
          id={`copy-code-btn-${Math.random().toString(36).substring(7)}`}
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
          title="Sao chép mã nguồn"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px] font-semibold">Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Sao chép</span>
            </>
          )}
        </button>
      </div>
      <div className="p-3.5 overflow-x-auto text-[13.5px] leading-snug font-mono">
        <pre className="m-0 p-0 bg-transparent text-slate-200">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

// Custom parser that breaks text into tokens: code blocks, block latex, headers, lists, tables, paragraphs with inline latex
function renderMarkdownToElements(content: string): React.ReactNode[] {
  if (!content) return [];

  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let i = 0;
  let elementKey = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block: ```language
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <CodeBlock
          key={`code-${elementKey++}`}
          code={codeLines.join('\n')}
          language={language}
        />
      );
      continue;
    }

    // 2. Block LaTeX $$...$$
    if (line.trim().startsWith('$$')) {
      let latexContent = line.trim().slice(2);
      if (latexContent.endsWith('$$') && latexContent.length > 2) {
        latexContent = latexContent.slice(0, -2);
        const html = renderLatex(latexContent, true);
        elements.push(
          <div
            key={`latex-${elementKey++}`}
            className="my-3 overflow-x-auto text-center py-2.5 px-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        i++;
        continue;
      } else {
        const latexLines: string[] = [latexContent];
        i++;
        while (i < lines.length && !lines[i].trim().endsWith('$$')) {
          latexLines.push(lines[i]);
          i++;
        }
        if (i < lines.length) {
          const last = lines[i].trim().replace(/\$\$$/, '');
          if (last) latexLines.push(last);
          i++;
        }
        const fullTex = latexLines.join('\n');
        const html = renderLatex(fullTex, true);
        elements.push(
          <div
            key={`latex-${elementKey++}`}
            className="my-3 overflow-x-auto text-center py-2.5 px-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/60 shadow-2xs"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        continue;
      }
    }

    // 3. Table (| Col 1 | Col 2 |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(renderTable(tableLines, `table-${elementKey++}`));
      continue;
    }

    // 4. Blockquote (> quote)
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${elementKey++}`}
          className="my-3 pl-3.5 py-1.5 border-l-4 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-r-2xl text-slate-700 dark:text-slate-300 italic text-[14.5px]"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className="m-0">
              {renderInlineMarkdown(ql)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // 5. Headings (#, ##, ###, ####)
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={`h1-${elementKey++}`} className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-4 mb-2">
          {renderInlineMarkdown(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={`h2-${elementKey++}`} className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-3.5 mb-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-1">
          {renderInlineMarkdown(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`h3-${elementKey++}`} className="text-base sm:text-lg font-bold text-teal-700 dark:text-teal-300 mt-3 mb-1">
          {renderInlineMarkdown(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith('#### ')) {
      elements.push(
        <h4 key={`h4-${elementKey++}`} className="text-[15px] font-semibold text-slate-800 dark:text-slate-200 mt-2 mb-1">
          {renderInlineMarkdown(line.slice(5))}
        </h4>
      );
      i++;
      continue;
    }

    // 6. Horizontal Rule (--- or ***)
    if (line.trim() === '---' || line.trim() === '***') {
      elements.push(
        <hr key={`hr-${elementKey++}`} className="my-3 border-slate-200 dark:border-slate-800" />
      );
      i++;
      continue;
    }

    // 7. Unordered Lists (- or *)
    if (/^(\s*)[-*+]\s/.test(line)) {
      const listItems: { text: string; indent: number }[] = [];
      while (i < lines.length && /^(\s*)[-*+]\s/.test(lines[i])) {
        const match = lines[i].match(/^(\s*)[-*+]\s(.*)$/);
        if (match) {
          listItems.push({
            indent: match[1].length,
            text: match[2],
          });
        }
        i++;
      }
      elements.push(
        <ul key={`ul-${elementKey++}`} className="my-2 pl-5 list-disc space-y-1 text-slate-800 dark:text-slate-200">
          {listItems.map((item, idx) => (
            <li key={idx} className={item.indent > 0 ? 'ml-4' : ''}>
              {renderInlineMarkdown(item.text)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 8. Ordered Lists (1. 2. 3.)
    if (/^(\s*)\d+\.\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^(\s*)\d+\.\s/.test(lines[i])) {
        const match = lines[i].match(/^(\s*)\d+\.\s(.*)$/);
        if (match) {
          listItems.push(match[2]);
        }
        i++;
      }
      elements.push(
        <ol key={`ol-${elementKey++}`} className="my-2 pl-5 list-decimal space-y-1 text-slate-800 dark:text-slate-200">
          {listItems.map((itemText, idx) => (
            <li key={idx}>
              {renderInlineMarkdown(itemText)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 9. Blank line
    if (!line.trim()) {
      i++;
      continue;
    }

    // 10. Normal Paragraph
    const paragraphLines: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('#') &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('$$') &&
      !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !/^(\s*)[-*+]\s/.test(lines[i]) &&
      !/^(\s*)\d+\.\s/.test(lines[i]) &&
      lines[i].trim() !== '---'
    ) {
      paragraphLines.push(lines[i]);
      i++;
    }

    elements.push(
      <p key={`p-${elementKey++}`} className="my-2 leading-relaxed">
        {renderInlineMarkdown(paragraphLines.join('\n'))}
      </p>
    );
  }

  return elements;
}

// Render markdown tables
function renderTable(tableLines: string[], key: string): React.ReactNode {
  if (tableLines.length < 2) return null;

  const rows = tableLines.map((row) =>
    row
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((c) => c.trim())
  );

  const headerRow = rows[0];
  // Check if second row is separator like :--- | ---:
  const isSeparator = /^[:\- ]+$/.test(rows[1].join(''));
  const bodyRows = isSeparator ? rows.slice(2) : rows.slice(1);

  return (
    <div key={key} className="my-3 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
      <table className="w-full text-left text-sm border-collapse">
        <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 font-bold border-b border-slate-200 dark:border-slate-700">
          <tr>
            {headerRow.map((cell, cIdx) => (
              <th key={cIdx} className="px-3.5 py-2.5">
                {renderInlineMarkdown(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
          {bodyRows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
              {row.map((cell, cIdx) => (
                <td key={cIdx} className="px-3.5 py-2.5">
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Parse inline formatting: LaTeX ($...$ or \(...\)), bold (**), italic (*), inline code (`), links ([text](url))
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  const mathRegex = /(\$([^\$\n]+)\$|\\\(([^\)]+)\\\))/g;
  let lastIndex = 0;
  let match;
  let partKey = 0;

  while ((match = mathRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        ...parseInlineTextFormatting(text.slice(lastIndex, match.index), `txt-${partKey++}`)
      );
    }

    const latex = match[2] || match[3];
    const html = renderLatex(latex, false);
    parts.push(
      <span
        key={`math-in-${partKey++}`}
        className="inline-block px-1 align-baseline font-serif"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(...parseInlineTextFormatting(text.slice(lastIndex), `txt-${partKey++}`));
  }

  return <>{parts}</>;
}

function parseInlineTextFormatting(text: string, prefix: string): React.ReactNode[] {
  const results: React.ReactNode[] = [];
  const lines = text.split('\n');

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) {
      results.push(<br key={`${prefix}-br-${lineIdx}`} />);
    }

    let remaining = line;
    let k = 0;

    const inlineRegex = /(`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/;

    while (remaining.length > 0) {
      const m = remaining.match(inlineRegex);
      if (!m || m.index === undefined) {
        results.push(<span key={`${prefix}-${lineIdx}-${k++}`}>{remaining}</span>);
        break;
      }

      if (m.index > 0) {
        results.push(
          <span key={`${prefix}-${lineIdx}-${k++}`}>{remaining.slice(0, m.index)}</span>
        );
      }

      if (m[2]) {
        // Inline code
        results.push(
          <code
            key={`${prefix}-${lineIdx}-${k++}`}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-teal-700 dark:text-teal-300 font-mono text-[13px] border border-slate-200/60 dark:border-slate-700/60"
          >
            {m[2]}
          </code>
        );
      } else if (m[3]) {
        // Bold
        results.push(
          <strong key={`${prefix}-${lineIdx}-${k++}`} className="font-bold text-slate-900 dark:text-white">
            {m[3]}
          </strong>
        );
      } else if (m[4]) {
        // Italic
        results.push(
          <em key={`${prefix}-${lineIdx}-${k++}`} className="italic">
            {m[4]}
          </em>
        );
      } else if (m[5] && m[6]) {
        // Link
        results.push(
          <a
            key={`${prefix}-${lineIdx}-${k++}`}
            href={m[6]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
          >
            {m[5]}
          </a>
        );
      }

      remaining = remaining.slice(m.index + m[0].length);
    }
  });

  return results;
}
