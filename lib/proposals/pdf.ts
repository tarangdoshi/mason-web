/* Browser-side PDF of the proposal: each A4 page element is rendered to an image by the browser itself
   (html-to-image draws the live DOM through SVG foreignObject, so fonts, colours and layout are the page's own)
   and placed full-bleed on an A4 PDF page. Nothing leaves the device.
   Offline: call warmPdf() and prepareFonts() while online (the staff screen: on load, and with the first
   proposal load); after that the
   libraries are in memory and the fonts are embedded from the captured CSS, so generation needs no network. */

type Modules = [typeof import("html-to-image"), typeof import("jspdf")];

let modules: Promise<Modules> | null = null;

export function warmPdf(): Promise<Modules> {
  modules ??= Promise.all([import("html-to-image"), import("jspdf")]).catch((error) => {
    modules = null;
    throw error;
  });
  return modules;
}

// Descend into @media/@supports/@layer blocks only: a style rule also has cssRules (CSS nesting) and is kept as is.
const flatten = (rules: CSSRule[]): CSSRule[] =>
  rules.flatMap((rule) =>
    !(rule instanceof CSSStyleRule) && "cssRules" in rule && (rule as CSSGroupingRule).cssRules
      ? flatten(Array.from((rule as CSSGroupingRule).cssRules))
      : [rule]
  );

function rulesOf(sheet: CSSStyleSheet): CSSRule[] {
  try {
    return flatten(Array.from(sheet.cssRules));
  } catch {
    return []; // cross-origin sheet: not ours
  }
}

const familyOf = (rule: CSSFontFaceRule) => rule.style.getPropertyValue("font-family").replace(/["']/g, "").trim();

/**
 * The @font-face rules of the next/font instance that defines `variable` (next/font emits each instance as a
 * contiguous block: its @font-face rules, then its className and variable rules). Needed because two
 * next/font instances of one family (the site's Newsreader and the proposal's Newsreader with optical sizing)
 * share the family name, and the image render would otherwise pick the wrong one.
 */
function facesFor(variable: string): { rules: CSSFontFaceRule[]; base: string } | null {
  for (const sheet of Array.from(document.styleSheets)) {
    let run: CSSFontFaceRule[] = [];
    for (const rule of rulesOf(sheet)) {
      if (rule instanceof CSSFontFaceRule) {
        run.push(rule);
      } else if (rule instanceof CSSStyleRule && rule.style.getPropertyValue(variable)) {
        if (run.length) return { rules: run, base: sheet.href ?? location.href };
      } else if (!(rule instanceof CSSStyleRule && rule.style.fontFamily)) {
        run = [];
      }
    }
  }
  return null;
}

function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function inline(rule: CSSFontFaceRule, base: string): Promise<string> {
  let css = rule.cssText;
  const urls = Array.from(css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g), (match) => match[1]).filter((url) => !url.startsWith("data:"));
  for (const url of new Set(urls)) {
    const response = await fetch(new URL(url, base).href);
    if (!response.ok) throw new Error(`Font ${response.status}`);
    css = css.split(url).join(await dataUrl(await response.blob()));
  }
  return css;
}

/** Embeddable CSS (data URLs) for the proposal's fonts: the proposal Newsreader (optical sizes) and the body
    and fallback fonts the node uses. Capture once while online; the PDF then needs no network. */
export async function prepareFonts(node: HTMLElement, displayVariable = "--font-proposal-display"): Promise<string> {
  const [htmlToImage] = await warmPdf();
  const display = facesFor(displayVariable);
  if (!display) return htmlToImage.getFontEmbedCSS(node);
  const displayFamilies = new Set(display.rules.map(familyOf));
  const used = getComputedStyle(node).fontFamily + "," + Array.from(node.querySelectorAll("*"), (element) => getComputedStyle(element).fontFamily).join(",");
  const usedFamilies = new Set(used.split(",").map((name) => name.replace(/["']/g, "").trim()));
  const others: { rule: CSSFontFaceRule; base: string }[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    for (const rule of rulesOf(sheet)) {
      if (!(rule instanceof CSSFontFaceRule)) continue;
      const family = familyOf(rule);
      if (displayFamilies.has(family) || !usedFamilies.has(family)) continue; // other same-named instances are skipped
      others.push({ rule, base: sheet.href ?? location.href });
    }
  }
  const css = await Promise.all([...display.rules.map((rule) => inline(rule, display.base)), ...others.map(({ rule, base }) => inline(rule, base))]);
  return css.join("\n");
}

/** The document with every component photo as a data URL (fetched now, while online). A photo that cannot be
    fetched keeps its URL. */
export async function inlinePhotos<T extends { essential: { photoUrl: string | null }[]; complimentary: { photoUrl: string | null }[]; addon: { photoUrl: string | null }[] }>(doc: T): Promise<T> {
  const cache = new Map<string, Promise<string>>();
  const inlineOne = (url: string) => {
    if (url.startsWith("data:")) return Promise.resolve(url);
    if (!cache.has(url)) {
      cache.set(url, fetch(url, { mode: "cors", credentials: "omit" })
        .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(String(response.status)))))
        .then(dataUrl)
        .catch(() => url));
    }
    return cache.get(url)!;
  };
  const list = async <I extends { photoUrl: string | null }>(items: I[]) =>
    Promise.all(items.map(async (item) => (item.photoUrl ? { ...item, photoUrl: await inlineOne(item.photoUrl) } : item)));
  return { ...doc, essential: await list(doc.essential), complimentary: await list(doc.complimentary), addon: await list(doc.addon) };
}

export const A4_PX = { width: 794, height: 1123 } as const;
const A4_PT = { width: 595.28, height: 841.89 } as const;

const SVG_PREFIX = "data:image/svg+xml;charset=utf-8,";

/**
 * html-to-image writes every font size as floor(size) - 0.1px (a guard against text overflow). The document
 * uses whole-pixel sizes only, so "12.9px" was 13px: put it back, or lines can re-wrap and the PDF would
 * no longer match the page.
 */
export function restoreFontSizes(svgDataUrl: string): string {
  if (!svgDataUrl.startsWith(SVG_PREFIX)) return svgDataUrl;
  const svg = decodeURIComponent(svgDataUrl.slice(SVG_PREFIX.length));
  const fixed = svg.replace(/font-size:\s*(\d+)\.9px/g, (_, whole: string) => `font-size: ${Number(whole) + 1}px`);
  return SVG_PREFIX + encodeURIComponent(fixed);
}

function rasterise(svgDataUrl: string, width: number, height: number, ratio: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "sync";
    image.onload = () => {
      // Give the browser a frame to apply the embedded fonts before drawing.
      requestAnimationFrame(() => {
        const canvas = document.createElement("canvas");
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        const context = canvas.getContext("2d");
        if (!context) return reject(new Error("No canvas"));
        context.fillStyle = "#fcf9f4";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      });
    };
    image.onerror = () => reject(new Error("The page could not be drawn."));
    image.src = svgDataUrl;
  });
}

export async function renderProposalPdf(pages: HTMLElement[], fontEmbedCSS?: string): Promise<Blob> {
  if (pages.length === 0) throw new Error("Nothing to render.");
  const [htmlToImage, { jsPDF }] = await warmPdf();
  // Pages are A4; one that grew past A4 (an unusually long proposal) gets a taller PDF page rather than being cut.
  const sizes = pages.map((page) => {
    const height = Math.max(A4_PX.height, Math.ceil(page.scrollHeight));
    return { height, pt: [A4_PT.width, (A4_PT.width * height) / A4_PX.width] as [number, number] };
  });
  const pdf = new jsPDF({ unit: "pt", format: sizes[0].pt, orientation: "portrait", compress: true });
  // No customer data in the PDF metadata.
  pdf.setProperties({ title: "Mason Company proposal", author: "Mason Company", creator: "Mason Company" });
  for (const [index, page] of pages.entries()) {
    const { height, pt } = sizes[index];
    const svg = await htmlToImage.toSvg(page, { width: A4_PX.width, height, backgroundColor: "#fcf9f4", fontEmbedCSS, cacheBust: false });
    const image = await rasterise(restoreFontSizes(svg), A4_PX.width, height, 2);
    if (index > 0) pdf.addPage(pt, "portrait");
    pdf.addImage(image, "JPEG", 0, 0, pt[0], pt[1], undefined, "FAST");
  }
  return pdf.output("blob");
}
