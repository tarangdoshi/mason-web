import { Fragment, type ReactNode } from "react";
import type { Heading } from "@/lib/cms/model";

/* Renders an editor-written heading: each line break in the text becomes its
   own line (wrapped by `renderLine`, so sections keep their own line markup),
   and each highlighted phrase gets the site's accent treatment. When a phrase
   appears more than once, its last occurrence is highlighted — accents in this
   design close the sentence ("…still feel like home"). Plain text only:
   nothing the editor types is ever interpreted as HTML. */

type Segment = { text: string; accent: boolean };

function segments(value: Heading): Segment[] {
  const text = value.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).join("\n");
  const ranges: [number, number][] = [];
  for (const phrase of [...new Set(value.highlights)].filter(Boolean).sort((a, b) => b.length - a.length)) {
    const start = text.lastIndexOf(phrase);
    if (start < 0) continue;
    const end = start + phrase.length;
    if (ranges.some(([s, e]) => start < e && end > s)) continue;
    ranges.push([start, end]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const out: Segment[] = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) out.push({ text: text.slice(cursor, start), accent: false });
    out.push({ text: text.slice(start, end), accent: true });
    cursor = end;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor), accent: false });
  return out;
}

/** Splits segments into lines at the heading's line breaks. */
function lines(value: Heading): Segment[][] {
  const result: Segment[][] = [[]];
  for (const segment of segments(value)) {
    segment.text.split("\n").forEach((part, index) => {
      if (index > 0) result.push([]);
      if (part) result[result.length - 1].push({ text: part, accent: segment.accent });
    });
  }
  return result.filter((line) => line.length);
}

export function headingLines(value: Heading): string[] {
  return lines(value).map((line) => line.map((segment) => segment.text).join(""));
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
  const all = lines(value);
  return (
    <>
      {all.map((line, index) => {
        const content = line.map((segment, i) =>
          segment.accent ? (
            <span key={i} className={accentClassName}>
              {segment.text}
            </span>
          ) : (
            <Fragment key={i}>{segment.text}</Fragment>
          )
        );
        return renderLine ? (
          <Fragment key={index}>{renderLine(content, index, all.length)}</Fragment>
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
