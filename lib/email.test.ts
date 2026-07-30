import assert from "node:assert/strict";
import test from "node:test";
import { isValidEmail, normalizeEmail, toCanonicalEmail } from "./email";

test("minimum accepted examples are valid", () => {
  for (const input of ["name@example.com", "first.last@example.com", "first.last+tag@example.co.in"]) {
    assert.equal(isValidEmail(input), true, `expected ${input} to be valid`);
  }
});

test("uppercase input is normalized to lowercase", () => {
  assert.equal(normalizeEmail("Name@Example.COM"), "name@example.com");
  assert.equal(toCanonicalEmail("FIRST.LAST+Tag@Example.CO.IN"), "first.last+tag@example.co.in");
});

test("leading and trailing whitespace is trimmed", () => {
  assert.equal(normalizeEmail("   name@example.com  "), "name@example.com");
  assert.equal(toCanonicalEmail("\t name@example.com \n"), "name@example.com");
});

test("plus-addressing is accepted", () => {
  assert.equal(isValidEmail("first.last+tag@example.com"), true);
  assert.equal(isValidEmail("user+shopping+lists@example.co.in"), true);
});

test(".co.in and other multi-label domains are accepted", () => {
  assert.equal(isValidEmail("user@example.co.in"), true);
  assert.equal(isValidEmail("user@mail.corp.example.org"), true);
});

test("empty and missing values are rejected", () => {
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail(normalizeEmail("   ")), false);
  assert.equal(toCanonicalEmail(""), null);
});

test("malformed values are rejected", () => {
  for (const input of [
    "abc",
    "abc@",
    "@gmail.com",
    "abc@gmail", // no TLD — the browser's native check accepts this
    "abc@gmail.",
    "abc@.com",
    "abc@-example.com",
    "abc@example-.com"
  ]) {
    assert.equal(isValidEmail(input), false, `expected ${input} to be rejected`);
  }
});

test("embedded spaces are rejected", () => {
  for (const input of ["a bc@example.com", "abc@exa mple.com", "abc @example.com", "abc@example.com "]) {
    assert.equal(isValidEmail(normalizeEmail(input).includes(" ") ? normalizeEmail(input) : input), false, `expected "${input}" to be rejected`);
  }
});

test("consecutive dots are rejected", () => {
  for (const input of ["first..last@example.com", "abc@example..com", ".abc@example.com", "abc.@example.com"]) {
    assert.equal(isValidEmail(input), false, `expected ${input} to be rejected`);
  }
});

test("multiple @ symbols are rejected", () => {
  for (const input of ["abc@def@example.com", "abc@@example.com", "a@b@c"]) {
    assert.equal(isValidEmail(input), false, `expected ${input} to be rejected`);
  }
});

test("overlong values are rejected", () => {
  const longLocal = "a".repeat(250);
  assert.equal(isValidEmail(`${longLocal}@example.com`), false);
});
