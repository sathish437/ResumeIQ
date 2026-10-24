import React from 'react';
import { BookmarkCheck, AlertCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { ResumeSource } from '../../types/resume';

export interface FormattedAiResponseProps {
  content: string;
  sources?: ResumeSource[];
  sourceReferences?: string[];
  insufficientEvidence?: boolean;
  className?: string;
  collapsibleSources?: boolean;
  documentName?: string;
}

/**
 * Parses inline formatting:
 * - Bold italic: ***text*** or ___text___
 * - Bold: **text** or __text__
 * - Italic: *text* or _text_
 * - Inline code: `code`
 * - Citation markers: [Page 1] or [Paragraph 2]
 *
 * Fully safe React nodes - ZERO dangerouslySetInnerHTML.
 */
function parseInline(text: string): React.ReactNode[] {
  // Regex to match inline tokens
  // Group 1: code `...`
  // Group 2: bold-italic ***...***
  // Group 3: bold **...**
  // Group 4: italic *...*
  // Group 5: citation marker [Page X] or [Paragraph X]
  const inlineRegex = /(`[^`]+`)|(?:\*\*\*|___)(.+?)(?:\*\*\*|___)|(?:\*\*|__)(.+?)(?:\*\*|__)|\*([^*]+)\*|(\[(?:Page|Paragraph)\s+\d+\])/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Append any text before the match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const key = `inline-${lastIndex}-${match.index}`;

    if (match[1]) {
      // Inline code
      const code = match[1].slice(1, -1);
      nodes.push(
        <code key={key} className="ai-inline-code">
          {code}
        </code>
      );
    } else if (match[2]) {
      // Bold italic
      nodes.push(
        <strong key={key} className="ai-bold">
          <em className="ai-italic">{match[2]}</em>
        </strong>
      );
    } else if (match[3]) {
      // Bold
      nodes.push(
        <strong key={key} className="ai-bold">
          {match[3]}
        </strong>
      );
    } else if (match[4]) {
      // Italic
      nodes.push(
        <em key={key} className="ai-italic">
          {match[4]}
        </em>
      );
    } else if (match[5]) {
      // Citation pill [Page 1]
      nodes.push(
        <span key={key} className="ai-citation-inline-badge">
          {match[5]}
        </span>
      );
    }

    lastIndex = inlineRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : [text];
}

interface Block {
  type: 'h1' | 'h2' | 'h3' | 'h4' | 'ul' | 'ol' | 'blockquote' | 'codeblock' | 'hr' | 'p';
  items?: string[];
  text?: string;
  lang?: string;
}

/**
 * Pre-processes markdown string to:
 * 1. Unescape escaped markdown delimiters (e.g. \*\* -> **, \_ -> _, \# -> #)
 * 2. Strip duplicate plain-text citation sections if structured sources are present
 */
function preprocessMarkdown(content: string, hasStructuredSources: boolean): string {
  if (!content) return '';

  // Unescape escaped asterisks, underscores, and hashes commonly produced in JSON outputs
  let cleaned = content
    .replace(/\\\*/g, '*')
    .replace(/\\_/g, '_')
    .replace(/\\#/g, '#');

  // If backend returned structured sources, remove redundant trailing plain-text citation blocks
  // such as "CITED EVIDENCE SOURCES:\n- Page 1: ..." or "### CITED EVIDENCE SOURCES"
  if (hasStructuredSources) {
    cleaned = cleaned.replace(
      /(?:\r?\n){1,2}(?:#{1,4}\s*)?(?:\*\*)?(?:CITED EVIDENCE SOURCES|CITED SOURCES|EVIDENCE SOURCES|SOURCES & CITATIONS|SOURCES)(?:\*\*)?:?[\s\S]*$/i,
      ''
    );
  }

  return cleaned.trim();
}

/**
 * Parses block-level markdown structures.
 */
function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/);
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Skip empty lines between blocks
    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced Code Block: ```lang
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      i++;
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing ```
      blocks.push({
        type: 'codeblock',
        text: codeLines.join('\n'),
        lang,
      });
      continue;
    }

    // Horizontal Rule: --- or *** or ___
    if (/^(?:---|\*\*\*|___)$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Headings
    if (trimmed.startsWith('#')) {
      const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const headingText = match[2].trim();
        let blockType: 'h1' | 'h2' | 'h3' | 'h4' = 'h3';
        if (level === 1) blockType = 'h1';
        else if (level === 2) blockType = 'h2';
        else if (level === 3) blockType = 'h3';
        else blockType = 'h4';

        blocks.push({ type: blockType, text: headingText });
        i++;
        continue;
      }
    }

    // Blockquote: > ...
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', text: quoteLines.join(' ') });
      continue;
    }

    // Unordered List: - or * or +
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered List: 1. or 2.
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Paragraph: collect consecutive lines until empty line or new block delimiter
    const paragraphLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('>') &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^(?:---|\*\*\*|___)$/.test(lines[i].trim())
    ) {
      paragraphLines.push(lines[i].trim());
      i++;
    }

    if (paragraphLines.length > 0) {
      blocks.push({ type: 'p', text: paragraphLines.join(' ') });
    }
  }

  return blocks;
}

export const FormattedAiResponse: React.FC<FormattedAiResponseProps> = ({
  content,
  sources,
  sourceReferences,
  insufficientEvidence,
  className = '',
  collapsibleSources = false,
  documentName,
}) => {
  const [isSourcesExpanded, setIsSourcesExpanded] = React.useState(false);
  const sourcesId = React.useId();

  // Deduplicate sources by reference and evidence
  const validSources = React.useMemo(() => {
    if (!sources || sources.length === 0) return [];
    const seen = new Set<string>();
    const result: ResumeSource[] = [];

    for (const src of sources) {
      if (!src || !src.reference) continue;
      const key = `${src.reference.toLowerCase().trim()}|${(src.evidence || '').toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(src);
      }
    }
    return result;
  }, [sources]);

  const hasSources = validSources.length > 0;
  const sourcesCount = validSources.length > 0 ? validSources.length : (sourceReferences?.length || 0);
  const hasAnySources = sourcesCount > 0;
  const processedText = React.useMemo(
    () => preprocessMarkdown(content, hasSources),
    [content, hasSources]
  );
  const blocks = React.useMemo(() => parseBlocks(processedText), [processedText]);

  return (
    <div className={`formatted-ai-response ${className}`}>
      {/* Insufficient Evidence Notice */}
      {insufficientEvidence && (
        <div className="ai-insufficient-banner" role="alert">
          <AlertCircle size={18} className="ai-insufficient-icon" />
          <div className="ai-insufficient-body">
            <span className="ai-insufficient-title">Limited Resume Evidence</span>
            <p className="ai-insufficient-desc">
              The uploaded resume does not contain sufficient verified evidence to answer this query reliably. No assumptions or unstated facts have been added.
            </p>
          </div>
        </div>
      )}

      {/* Main Formatted Content */}
      <div className="ai-response-body">
        {blocks.map((block, idx) => {
          switch (block.type) {
            case 'h1':
              return (
                <h2 key={idx} className="ai-heading ai-heading-1">
                  {parseInline(block.text || '')}
                </h2>
              );
            case 'h2':
              return (
                <h3 key={idx} className="ai-heading ai-heading-2">
                  {parseInline(block.text || '')}
                </h3>
              );
            case 'h3':
              return (
                <h4 key={idx} className="ai-heading ai-heading-3">
                  {parseInline(block.text || '')}
                </h4>
              );
            case 'h4':
              return (
                <h5 key={idx} className="ai-heading ai-heading-4">
                  {parseInline(block.text || '')}
                </h5>
              );
            case 'ul':
              return (
                <ul key={idx} className="ai-list ai-unordered-list">
                  {block.items?.map((item, itemIdx) => (
                    <li key={itemIdx} className="ai-list-item">
                      {parseInline(item)}
                    </li>
                  ))}
                </ul>
              );
            case 'ol':
              return (
                <ol key={idx} className="ai-list ai-ordered-list">
                  {block.items?.map((item, itemIdx) => (
                    <li key={itemIdx} className="ai-list-item">
                      {parseInline(item)}
                    </li>
                  ))}
                </ol>
              );
            case 'blockquote':
              return (
                <blockquote key={idx} className="ai-blockquote">
                  {parseInline(block.text || '')}
                </blockquote>
              );
            case 'codeblock':
              return (
                <div key={idx} className="ai-codeblock-wrapper">
                  {block.lang && (
                    <div className="ai-codeblock-header">{block.lang}</div>
                  )}
                  <pre className="ai-codeblock">
                    <code>{block.text}</code>
                  </pre>
                </div>
              );
            case 'hr':
              return <hr key={idx} className="ai-divider" />;
            case 'p':
            default:
              return (
                <p key={idx} className="ai-paragraph">
                  {parseInline(block.text || '')}
                </p>
              );
          }
        })}
      </div>

      {/* Structured Source Citations & Evidence Section */}
      {collapsibleSources ? (
        hasAnySources && (
          <div className="chat-sources-disclosure">
            <button
              type="button"
              className="chat-sources-toggle-btn"
              onClick={() => setIsSourcesExpanded((prev) => !prev)}
              aria-expanded={isSourcesExpanded}
              aria-controls={sourcesId}
              title={isSourcesExpanded ? 'Collapse sources' : `Expand sources (${sourcesCount})`}
            >
              <BookmarkCheck size={13} className="chat-sources-toggle-icon" />
              <span className="chat-sources-toggle-label">
                {isSourcesExpanded ? `Hide Sources (${sourcesCount})` : `View Sources (${sourcesCount})`}
              </span>
              {isSourcesExpanded ? (
                <ChevronUp size={13} className="chat-sources-chevron" />
              ) : (
                <ChevronDown size={13} className="chat-sources-chevron" />
              )}
            </button>

            {isSourcesExpanded && (
              <div id={sourcesId} className="chat-sources-expanded-area">
                {hasSources ? (
                  <div className="ai-evidence-list">
                    {validSources.map((src, sIdx) => (
                      <div key={sIdx} className="ai-evidence-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          {documentName && (
                            <span className="ai-evidence-doc-pill">
                              <FileText size={11} />
                              <span>{documentName}</span>
                            </span>
                          )}
                          {src.reference && (
                            <div className="ai-evidence-ref-pill">
                              {src.reference}
                            </div>
                          )}
                        </div>
                        {src.evidence && (
                          <div className="ai-evidence-quote">
                            “{src.evidence}”
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ai-evidence-pills-row">
                    {Array.from(new Set(sourceReferences)).map((ref, rIdx) => (
                      <span key={rIdx} className="ai-evidence-ref-pill">
                        {ref}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      ) : (
        <>
          {hasSources && (
            <div className="ai-evidence-container">
              <div className="ai-evidence-header">
                <BookmarkCheck size={14} className="ai-evidence-icon" />
                <span className="ai-evidence-title">
                  Cited Evidence Sources ({validSources.length})
                </span>
              </div>
              <div className="ai-evidence-list">
                {validSources.map((src, sIdx) => (
                  <div key={sIdx} className="ai-evidence-card">
                    <div className="ai-evidence-ref-pill">
                      {src.reference}
                    </div>
                    {src.evidence && (
                      <div className="ai-evidence-quote">
                        “{src.evidence}”
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasSources && sourceReferences && sourceReferences.length > 0 && (
            <div className="ai-evidence-container">
              <div className="ai-evidence-header">
                <BookmarkCheck size={14} className="ai-evidence-icon" />
                <span className="ai-evidence-title">Cited References</span>
              </div>
              <div className="ai-evidence-pills-row">
                {Array.from(new Set(sourceReferences)).map((ref, rIdx) => (
                  <span key={rIdx} className="ai-evidence-ref-pill">
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
