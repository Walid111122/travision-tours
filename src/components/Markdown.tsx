import React from 'react';
import { Link } from 'react-router-dom';

/**
 * The blog's markdown-subset renderer — paragraphs, `##`/`###` headings,
 * `- ` lists, `**bold**` and `[text](href)` links — rendered as React nodes,
 * never as raw HTML, so stored content cannot inject markup.
 *
 * Shared by the public article page and the admin preview so a draft preview
 * is the exact rendering a visitor would get.
 */

const INLINE_RE = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let n = 0;
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(text))) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    if (match[3] !== undefined) {
      parts.push(<strong key={`${keyBase}-b${n++}`} className="text-white font-medium">{match[3]}</strong>);
    } else {
      const [, label, href] = match;
      parts.push(
        href.startsWith('/') ? (
          <Link key={`${keyBase}-l${n++}`} to={href} className="text-egypt-gold underline underline-offset-2 hover:text-white">
            {label}
          </Link>
        ) : (
          <a key={`${keyBase}-l${n++}`} href={href} target="_blank" rel="noreferrer" className="text-egypt-gold underline underline-offset-2 hover:text-white">
            {label}
          </a>
        )
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <>
      {content
        .trim()
        .split(/\n\n+/)
        .map((block, i) => {
          const key = `block-${i}`;
          if (block.startsWith('### ')) {
            return (
              <h3 key={key} className="mt-10 font-serif text-xl text-white">
                {block.slice(4)}
              </h3>
            );
          }
          if (block.startsWith('## ')) {
            return (
              <h2 key={key} className="mt-12 font-serif text-2xl md:text-3xl uppercase tracking-tight text-white">
                {block.slice(3)}
              </h2>
            );
          }
          const lines = block.split('\n');
          if (lines.every(line => line.startsWith('- '))) {
            return (
              <ul key={key} className="mt-6 list-disc space-y-2 pl-6 text-egypt-papyrus/70 font-light leading-relaxed marker:text-egypt-gold">
                {lines.map((line, j) => (
                  <li key={`${key}-${j}`}>{renderInline(line.slice(2), `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          }
          return (
            <p key={key} className="mt-6 text-egypt-papyrus/70 font-light leading-relaxed">
              {renderInline(lines.join(' '), key)}
            </p>
          );
        })}
    </>
  );
}
