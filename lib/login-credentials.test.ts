import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

// The CRM login screen is a client component shipped to every visitor, in every environment. It must
// never carry demo accounts, default passwords or a real staff login to copy.
const LOGIN_DIR = join(process.cwd(), "app", "(crm)", "crm", "login");

test("CRM login screen ships no demo accounts, default passwords or staff logins", () => {
  const files = readdirSync(LOGIN_DIR).filter((name) => /\.(tsx?|jsx?)$/.test(name));
  assert.ok(files.length >= 2, "login screen and form are checked");
  for (const name of files) {
    const source = readFileSync(join(LOGIN_DIR, name), "utf8");
    assert.doesNotMatch(source, /demo accounts?/i, `${name}: demo-account text`);
    assert.doesNotMatch(source, /Aegis(Admin|Agent)\d+!/, `${name}: default seed password`);
    assert.doesNotMatch(source, /(admin|asha|rohan)@masoncompany\.in/i, `${name}: a real staff login`);
  }
});
