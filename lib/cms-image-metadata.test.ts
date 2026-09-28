import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createSchema, validateDocument } from "sanity";
import { schemaTypes } from "../sanity/schemaTypes";

const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (html: string, options: { url: string }) => { window: Window };
};

type CompiledType = {
  name?: string;
  description?: string;
  options?: { hotspot?: boolean };
  readOnly?: unknown;
  hidden?: unknown;
  fields?: { name: string; type: CompiledType }[];
  of?: CompiledType[];
  validation?: { _required?: string; _rules: { flag: string; constraint: unknown }[] }[];
};

const schema = createSchema({ name: "mason-image-metadata", types: schemaTypes });
const document = (name: string) => schema.get(name) as unknown as CompiledType;
const field = (type: CompiledType, name: string): CompiledType => {
  const found = type.fields?.find((item) => item.name === name);
  assert.ok(found, `missing schema field ${name}`);
  return found.type;
};
const arrayMember = (type: CompiledType): CompiledType => {
  assert.ok(type.of?.[0], "missing array member schema");
  return type.of[0];
};
const customResults = (type: CompiledType, value: unknown, documentType: string, path: string[]) =>
  (type.validation ?? []).flatMap((rule) => rule._rules)
    .filter((rule) => rule.flag === "custom")
    .map((rule) => {
      assert.equal(typeof rule.constraint, "function");
      return (rule.constraint as (value: unknown, context: object) => unknown)(value, { document: { _type: documentType }, path, parent: {} });
    });

const currentImages: [string, string[]][] = [
  ["homepage", ["hero", "backgroundImage"]],
  ["homepage", ["hero", "backgroundImageMobile"]],
  ["homepage", ["whatWeDoSection", "sideImage"]],
  ["homepage", ["finalCtaSection", "backgroundImage"]],
  ["aboutPage", ["hero", "image"]],
  ["aboutPage", ["story", "image"]],
  ["aboutPage", ["team", "founders", "[]", "photo"]],
  ["aboutPage", ["approach", "image"]],
  ["aboutPage", ["closing", "image"]],
  ["packagesPage", ["image"]],
  ["packageFeature", ["image"]],
  ["testimonial", ["photo"]],
  ["doctor", ["photo"]],
  ["gallery", ["sliderBefore"]],
  ["gallery", ["sliderAfter"]],
  ["gallery", ["tiles", "[]", "image"]],
  ["siteSettings", ["contactImage"]],
  ...["home", "about", "packages", "packageStandard", "packageAdvanced", "contact", "why", "privacy", "terms"]
    .map((page): [string, string[]] => ["seo", [page, "socialImage"]])
];

function visibleImagePaths(type: CompiledType, path: string[] = []): string[] {
  if (type.hidden === true) return [];
  if (type.name === "imageWithAlt") return [path.join(".")];
  return [
    ...(type.fields ?? []).flatMap((entry) => visibleImagePaths(entry.type, [...path, entry.name])),
    ...(type.of ?? []).flatMap((member) => visibleImagePaths(member, [...path, "[]"]))
  ];
}

const uploaded = { _type: "imageWithAlt", asset: { _type: "reference", _ref: "image-test-1200x1500-jpg" } };

test("all 26 current public CMS image paths accept blank and supplied alt without weakening image controls", () => {
  assert.equal(currentImages.length, 26);
  const currentDocumentTypes = ["homepage", "aboutPage", "package", "packagesPage", "packageFeature", "testimonial", "doctor", "gallery", "siteSettings", "seo", "faqs"];
  const discovered = currentDocumentTypes.flatMap((type) => visibleImagePaths(document(type), [type])).sort();
  const expected = currentImages.map(([type, path]) => [type, ...path].join(".")).sort();
  assert.deepEqual(discovered, expected, "the image-path audit must cover every visible current CMS field");
  assert.equal(document("imageWithAlt").options?.hotspot, true);
  const alt = field(document("imageWithAlt"), "alt");
  assert.ok(alt.validation?.every((rule) => rule._required !== "required") ?? true);
  assert.doesNotMatch(alt.description ?? "", /required/i);

  for (const [documentType, path] of currentImages) {
    let type = document(documentType);
    for (const segment of path) {
      type = segment === "[]" ? arrayMember(type) : field(type, segment);
      assert.ok(type.readOnly === undefined || type.readOnly === false, `${documentType}.${path.join(".")} is read-only`);
      assert.ok(type.hidden === undefined || type.hidden === false, `${documentType}.${path.join(".")} is hidden`);
    }
    const label = `${documentType}.${path.join(".")}`;
    assert.equal(type.name, "imageWithAlt", `${label} must remain a CMS image`);
    assert.match(type.description ?? "", /Alt text is optional/);
    assert.doesNotMatch(type.description ?? "", /Alt text is required/);
    assert.match(type.description ?? "", /Switch the Studio perspective from Published to Drafts/);
    for (const value of [uploaded, { ...uploaded, alt: "Meaningful description" }]) {
      assert.ok(type.validation?.every((rule) => rule._required !== "required") ?? true, `${label} image became required`);
      assert.ok(customResults(type, value, documentType, path).every((result) => result === true), `${label} rejected image metadata`);
    }
  }
});

test("package identity and the shared kit stay protected", () => {
  for (const [documentType, fieldName] of [
    ["package", "name"], ["package", "code"], ["package", "includedFeatures"],
    ["packageFeature", "key"], ["packageFeature", "quantity"], ["packagesPage", "cardRows"]
  ]) {
    assert.equal(field(document(documentType), fieldName).readOnly, true, `${documentType}.${fieldName} must stay protected`);
  }
  for (const fieldName of ["priceInr", "referencePriceInr"]) {
    assert.equal(field(document("package"), fieldName).readOnly, undefined, `package.${fieldName} must stay editable`);
  }
});

test("Sanity validates images with blank or supplied alt across current document types", async () => {
  const browser = new JSDOM("<!doctype html>", { url: "https://studio.test" });
  const originals = new Map(["window", "document", "navigator"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: browser.window.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: browser.window.navigator });
  const validate = async (value: Record<string, unknown>) => validateDocument({
    workspace: { schema } as never,
    document: value as never,
    getClient: () => ({}) as never,
    getDocumentExists: async () => true
  });
  try {
    for (const image of [uploaded, { ...uploaded, alt: "Meaningful description" }]) {
      const documents = [
        { _id: "homepage", _type: "homepage", hero: { backgroundImage: image, backgroundImageMobile: image }, whatWeDoSection: { sideImage: image }, finalCtaSection: { backgroundImage: image } },
        { _id: "aboutPage", _type: "aboutPage", hero: { image }, story: { image }, team: { founders: [{ _key: "one", _type: "founder", name: "Founder", bio: "Bio", photo: image }] }, approach: { image }, closing: { image } },
        { _id: "packagesPage", _type: "packagesPage", image },
        { _id: "packageFeature-one", _type: "packageFeature", key: "grab-bar", label: "Grab bar", quantity: 3, image },
        { _id: "testimonial-one", _type: "testimonial", name: "Customer", quote: "Quote", photo: image },
        { _id: "doctor-one", _type: "doctor", name: "Expert", specialty: "MD", registration: "Goa", quote: "Quote", photo: image },
        { _id: "gallery", _type: "gallery", sliderBefore: image, sliderAfter: image, tiles: [{ _key: "one", _type: "galleryTile", image }] },
        { _id: "siteSettings", _type: "siteSettings", contactImage: image, supportEmail: "help@masoncompany.in", supportHours: "Weekdays", phoneDisplay: "+91 81494 33383", phoneTel: "+918149433383", whatsappUrl: "https://wa.me/918149433383", doctorDisclaimer: "Medical advice varies." },
        { _id: "seo", _type: "seo", home: { socialImage: image }, about: { socialImage: image }, packages: { socialImage: image }, packageStandard: { socialImage: image }, packageAdvanced: { socialImage: image }, contact: { socialImage: image }, why: { socialImage: image }, privacy: { socialImage: image }, terms: { socialImage: image } }
      ];
      for (const value of documents) {
        assert.deepEqual(await validate(value), [], `${value._type} rejected ${"alt" in image ? "supplied" : "blank"} alt`);
      }
    }
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    browser.window.close();
  }
});
