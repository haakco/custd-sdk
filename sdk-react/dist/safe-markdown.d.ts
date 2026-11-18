export type SafeMarkdownProps = {
    source: string;
    className?: string;
};
/**
 * A small Markdown subset (paragraphs, `-` lists, `code`, **bold**, *italic* and http, https or
 * mailto links) built as React elements. Text is never parsed as HTML, so markup in a
 * description is shown as written.
 */
export declare function SafeMarkdown({ source, className }: SafeMarkdownProps): import("react").JSX.Element;
