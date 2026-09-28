import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { createSchema, validateDocument } from "sanity";
import { schemaTypes } from "../sanity/schemaTypes";

const { JSDOM } = createRequire(import.meta.url)("jsdom") as {
  JSDOM: new (html: string, options: { url: string }) => { window: Window };
};

type CompiledType = {
  description?: string;
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
const noRequiredMarker = (type: CompiledType) => {
  assert.ok(type.validation?.every((rule) => rule._required !== "required"));
};
const customValidator = (type: CompiledType) => {
  const custom = type.validation?.flatMap((rule) => rule._rules).find((rule) => rule.flag === "custom");
  assert.ok(custom, "expected Sanity custom validation");
  assert.equal(typeof custom.constraint, "function", "expected Sanity custom validation");
  return custom.constraint as (value: unknown, context: { document: { _type: string }; path: unknown[] }) => true | string;
};
const image = { asset: { _ref: "image-test-1200x1500-jpg" } };

test("current public Gallery has optional alt and caption in the compiled Studio schema", () => {
  const gallery = document("gallery");
  const tile = arrayMember(field(gallery, "tiles"));
  const caption = field(tile, "label");
  const photo = field(tile, "image");
  const alt = field(document("imageWithAlt"), "alt");
  noRequiredMarker(caption);
  noRequiredMarker(alt);
  assert.match(photo.description ?? "", /Alt text is optional/);
  assert.equal(customValidator(photo)(image, { document: { _type: "gallery" }, path: ["tiles", { _key: "tile" }, "image"] }), true);
  assert.equal(customValidator(alt)(undefined, { document: { _type: "gallery" }, path: ["tiles", { _key: "tile" }, "image", "alt"] }), true);
  for (const name of ["sliderBefore", "sliderAfter"]) {
    assert.match(field(gallery, name).description ?? "", /Alt text is optional/);
    assert.equal(customValidator(field(gallery, name))(image, { document: { _type: "gallery" }, path: [name] }), true);
  }
});

test("only About founder portraits waive alt validation; the photo itself stays optional", () => {
  const about = document("aboutPage");
  const portrait = field(arrayMember(field(field(about, "team"), "founders")), "photo");
  const alt = field(document("imageWithAlt"), "alt");
  const founderContext = { document: { _type: "aboutPage" }, path: ["team", "founders", { _key: "founder" }, "photo", "alt"] };
  noRequiredMarker(portrait);
  noRequiredMarker(alt);
  assert.match(portrait.description ?? "", /Alt text is optional/);
  assert.equal(customValidator(portrait)(undefined, { ...founderContext, path: founderContext.path.slice(0, -1) }), true);
  assert.equal(customValidator(portrait)(image, { ...founderContext, path: founderContext.path.slice(0, -1) }), true);
  assert.equal(customValidator(alt)(undefined, founderContext), true);
  assert.equal(customValidator(alt)("Portrait in the workshop", founderContext), true);

  const otherAboutPath = { document: { _type: "aboutPage" }, path: ["hero", "image", "alt"] };
  assert.equal(customValidator(alt)(undefined, otherAboutPath), "Alt text is required.");
  assert.equal(customValidator(field(field(about, "hero"), "image"))(image, { ...otherAboutPath, path: ["hero", "image"] }), "Add descriptive alt text before publishing this image.");
});

test("only About Our approach image waives alt validation; the image itself stays optional", () => {
  const about = document("aboutPage");
  const photo = field(field(about, "approach"), "image");
  const alt = field(document("imageWithAlt"), "alt");
  const context = { document: { _type: "aboutPage" }, path: ["approach", "image", "alt"] };
  noRequiredMarker(photo);
  assert.match(photo.description ?? "", /Alt text is optional/);
  assert.equal(customValidator(photo)(undefined, { ...context, path: ["approach", "image"] }), true);
  assert.equal(customValidator(photo)(image, { ...context, path: ["approach", "image"] }), true);
  assert.equal(customValidator(alt)(undefined, context), true);
  assert.equal(customValidator(alt)("Installer fitting a grab bar", context), true);

  for (const section of ["hero", "story", "closing"]) {
    const otherPhoto = field(field(about, section), "image");
    assert.match(otherPhoto.description ?? "", /Alt text is required/);
    assert.equal(customValidator(otherPhoto)(image, { ...context, path: [section, "image"] }), "Add descriptive alt text before publishing this image.");
    assert.equal(customValidator(alt)(undefined, { ...context, path: [section, "image", "alt"] }), "Alt text is required.");
  }
});

test("other CMS imagery and legacy gallery retain descriptive alt validation", () => {
  const alt = customValidator(field(document("imageWithAlt"), "alt"));
  for (const type of ["homepage", "packagesPage", "packageFeature", "galleryItem", "contactPage"]) {
    assert.equal(alt(undefined, { document: { _type: type }, path: ["image", "alt"] }), "Alt text is required.", type);
  }
  const oldGallery = document("galleryItem");
  assert.equal(customValidator(field(oldGallery, "beforeImage"))(image, { document: { _type: "galleryItem" }, path: ["beforeImage"] }), "Add descriptive alt text before publishing this image.");
});

test("Sanity's document validator accepts blank founder/Gallery/approach metadata but rejects blank alt elsewhere", async () => {
  const browser = new JSDOM("<!doctype html>", { url: "https://studio.test" });
  const originals = new Map(["window", "document", "navigator"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser.window });
  Object.defineProperty(globalThis, "document", { configurable: true, value: browser.window.document });
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: browser.window.navigator });
  const uploaded = { _type: "imageWithAlt", asset: { _type: "reference", _ref: "image-test-1200x1500-jpg" } };
  const validate = async (value: Record<string, unknown>) => validateDocument({
    workspace: { schema } as never,
    document: value as never,
    getClient: () => ({}) as never,
    getDocumentExists: async () => true
  });
  try {
    const founder = await validate({
      _id: "aboutPage", _type: "aboutPage",
      team: { founders: [
        { _key: "one", _type: "founder", name: "One", bio: "Bio", photo: uploaded },
        { _key: "two", _type: "founder", name: "Two", bio: "Bio", photo: { ...uploaded, alt: "Founder in the studio" } }
      ] }
    });
    assert.deepEqual(founder, []);

    const approachBlankAlt = await validate({ _id: "aboutPage", _type: "aboutPage", approach: { image: uploaded } });
    assert.deepEqual(approachBlankAlt, []);
    const approachSuppliedAlt = await validate({ _id: "aboutPage", _type: "aboutPage", approach: { image: { ...uploaded, alt: "Installer fitting a grab bar" } } });
    assert.deepEqual(approachSuppliedAlt, []);
    const approachNoImage = await validate({ _id: "aboutPage", _type: "aboutPage", approach: {} });
    assert.deepEqual(approachNoImage, []);

    const gallery = await validate({
      _id: "gallery", _type: "gallery", tiles: [
        { _key: "both", _type: "galleryTile", label: "Caption", image: { ...uploaded, alt: "Described photo" } },
        { _key: "neither", _type: "galleryTile", image: uploaded },
        { _key: "alt", _type: "galleryTile", image: { ...uploaded, alt: "Described photo" } },
        { _key: "caption", _type: "galleryTile", label: "Caption", image: uploaded }
      ]
    });
    assert.deepEqual(gallery, []);

    const aboutHero = await validate({ _id: "aboutPage", _type: "aboutPage", hero: { image: uploaded } });
    assert.ok(aboutHero.some((marker) => marker.message === "Alt text is required."));
    assert.ok(aboutHero.some((marker) => marker.message === "Add descriptive alt text before publishing this image."));
  } finally {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
    browser.window.close();
  }
});
