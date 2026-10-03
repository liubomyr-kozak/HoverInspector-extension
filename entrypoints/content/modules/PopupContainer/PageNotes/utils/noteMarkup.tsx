import React from "react";

/**
 * The Note Taking Tools toolbar writes **bold**, *italic*, <u>underline</u> and [text](url) into the
 * note text. These helpers show that formatting instead of the raw markers. They build React elements
 * (never HTML), so note text can't inject markup.
 */
// Link URLs may contain one level of balanced parentheses (`javascript:alert(1)`, wiki links), so the
// whole link is consumed and no stray ")" is left behind after a blocked or allowed link.
const INLINE_PATTERN =
  /\*\*([^*\n]+)\*\*|\*([^*\n]+)\*|<u>([^<\n]+)<\/u>|\[([^\]\n]+)\]\(((?:[^()\s]|\([^()\s]*\))+)\)/g;

const isSafeUrl = (url: string) => /^(https?:|mailto:)/i.test(url);

export const renderNoteMarkup = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) nodes.push(text.slice(lastIndex, index));
    const [whole, bold, italic, underline, linkText, linkUrl] = match;
    if (bold !== undefined) nodes.push(<strong key={key++}>{bold}</strong>);
    else if (italic !== undefined) nodes.push(<em key={key++}>{italic}</em>);
    else if (underline !== undefined) nodes.push(<u key={key++}>{underline}</u>);
    else if (linkText !== undefined && isSafeUrl(linkUrl)) {
      nodes.push(
        <a
          key={key++}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "inherit", textDecoration: "underline" }}
          onClick={(event) => event.stopPropagation()}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {linkText}
        </a>,
      );
    } else if (linkText !== undefined) nodes.push(linkText);
    else nodes.push(whole);
    lastIndex = index + whole.length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

/**
 * Plain text of a note for one-line previews
 */
export const stripNoteMarkup = (text: string): string =>
  text.replace(INLINE_PATTERN, (whole, bold, italic, underline, linkText) => bold ?? italic ?? underline ?? linkText ?? whole);
