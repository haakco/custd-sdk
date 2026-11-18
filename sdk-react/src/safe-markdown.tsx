import type { ReactNode } from "react";

export type SafeMarkdownProps = {
  source: string;
  className?: string;
};

/** Link targets a description may open; anything else is shown as plain text. */
const SAFE_HREF = /^(?:https?:\/\/|mailto:)/i;
// Emphasis needs text hard against its asterisks, so `a * b * c` in a formula stays as written;
// underscores are left alone because quantity names use them.
const INLINE = /(`[^`]+`)|(\*\*[^\s*](?:[^*]*[^\s*])?\*\*)|(\*[^\s*](?:[^*]*[^\s*])?\*)|(\[[^\]]+\]\([^)\s]+\))/g;
const LIST_ITEM = /^\s*[-*]\s+/;

/**
 * A small Markdown subset (paragraphs, `-` lists, `code`, **bold**, *italic* and http, https or
 * mailto links) built as React elements. Text is never parsed as HTML, so markup in a
 * description is shown as written.
 */
export function SafeMarkdown({ source, className }: SafeMarkdownProps) {
  return (
    <div className={className} data-custd-markdown="">
      {blocksOf(source.replace(/\r\n?/g, "\n")).map((block) =>
        block.items ? (
          <ul key={block.at}>
            {block.items.map((item) => (
              <li key={item.at}>{inline(item.text)}</li>
            ))}
          </ul>
        ) : (
          <p key={block.at}>{inline(block.text)}</p>
        ),
      )}
    </div>
  );
}

type Line = { at: number; text: string };
type Block = Line & { items?: Line[] };

/** Splits on blank lines; a block whose every line starts with `-` or `*` is a list. Keys are offsets. */
function blocksOf(source: string): Block[] {
  const blocks: Block[] = [];
  let lines: Line[] = [];
  let at = 0;
  const flush = () => {
    const first = lines[0];
    if (first) {
      const list = lines.every((line) => LIST_ITEM.test(line.text));
      blocks.push({
        at: first.at,
        text: lines.map((line) => line.text).join(" "),
        items: list ? lines.map((line) => ({ at: line.at, text: line.text.replace(LIST_ITEM, "") })) : undefined,
      });
    }
    lines = [];
  };
  for (const text of source.split("\n")) {
    if (text.trim() === "") flush();
    else lines.push({ at, text });
    at += text.length + 1;
  }
  flush();
  return blocks;
}

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let at = 0;
  for (const match of text.matchAll(INLINE)) {
    const index = match.index ?? 0;
    if (index > at) nodes.push(text.slice(at, index));
    nodes.push(inlineNode(match, index));
    at = index + match[0].length;
  }
  if (at < text.length) nodes.push(text.slice(at));
  return nodes;
}

function inlineNode(match: RegExpMatchArray, key: number): ReactNode {
  const [whole, code, bold, italic, link] = match;
  if (code) return <code key={key}>{code.slice(1, -1)}</code>;
  if (bold) return <strong key={key}>{bold.slice(2, -2)}</strong>;
  if (italic) return <em key={key}>{italic.slice(1, -1)}</em>;
  if (link) {
    const split = link.indexOf("](");
    const label = link.slice(1, split);
    const href = link.slice(split + 2, -1);
    if (!SAFE_HREF.test(href)) return label;
    return (
      <a key={key} href={href} rel="noopener noreferrer nofollow" target="_blank">
        {label}
      </a>
    );
  }
  return whole;
}
