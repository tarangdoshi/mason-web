import { Fragment, type ReactNode } from "react";
import type { Heading } from "@/lib/cms/model";

/* Renders an editor-written heading: each line break in the text becomes its
   own line (wrapped by `renderLine`, so sections keep their own line markup),
   and every highlighted phrase gets the site's accent treatment. Plain text
   only — nothing the editor types is ever interpreted as HTML. */

function highlight(line: string, highlights: string[], accentClassName: string): ReactNode[] {
  const phrases = highlights.filter((phrase) => phrase && line.includes(phrase)).sort((a, b) => b.length - a.length);
  if (!phrases.length) return [line];
  const escaped = phrases.map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return line.split(new RegExp(`(${escaped.join("|")})`, "g")).map((part, index) =>
    phrases.includes(part) ? (
      <span key={index} className={accentClassName}>
        {part}
      </span>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    )
  );
}

export function headingLines(value: Heading): string[] {
  return value.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

export default function HighlightedText({
  value,
  accentClassName = "accent-word",
  renderLine
}: {
  value: Heading;
  accentClassName?: string;
  /** Wraps each line. Without it, lines are joined with a space. */
  renderLine?: (content: ReactNode, index: number, count: number) => ReactNode;
}) {
  const lines = headingLines(value);
  return (
    <>
      {lines.map((line, index) => {
        const content = highlight(line, value.highlights, accentClassName);
        return renderLine ? (
          <Fragment key={index}>{renderLine(content, index, lines.length)}</Fragment>
        ) : (
          <Fragment key={index}>
            {index > 0 ? " " : null}
            {content}
          </Fragment>
        );
      })}
    </>
  );
}
