import { expect, test, type Page } from "@playwright/test";

/* Proposal Builder Phase 3: the staff screen with no signal (service worker, local pricing, queued sync),
   "Customer accepts" and "Lost". Synthetic data only. */
const API = "http://127.0.0.1:4410";

type LogEntry = { method: string; path: string; role?: string; body?: Record<string, unknown> };
async function log(page: Page): Promise<LogEntry[]> {
  return (await (await page.request.get(`${API}/__log`)).json()).data;
}
const writes = async (page: Page) => (await log(page)).filter((entry) => entry.method !== "GET" && entry.path.startsWith("/api/v1/internal/proposals"));
const summary = async (page: Page) => (await writes(page)).map((entry) => `${entry.method} ${entry.path.replace(/[0-9a-f-]{36}/, ":id")}`);
async function signIn(page: Page, role: "admin" | "agent") {
  await page.context().addCookies([{ name: "mason-crm-session", value: `e2e-${role}`, url: "http://127.0.0.1:3410" }]);
}
const mock = (page: Page, path: string, data?: unknown) => page.request.post(`${API}${path}`, data === undefined ? undefined : { data });

/** Opens the builder and waits until the service worker controls it and holds the offline copy. */
async function openControlled(page: Page) {
  await page.goto("/crm/proposals/new");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 30_000 }).toBe(true);
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match("/crm/proposals/offline-bundle"))), { timeout: 30_000 }).toBe(true);
  await expect.poll(() => page.evaluate(async () => Boolean(await caches.match("/crm/proposals/new")))).toBe(true);
}

test.beforeEach(async ({ request }) => { await request.post(`${API}/__reset`); });
test.afterEach(async ({ context }) => { await context.setOffline(false); });

test("offline: build → price → Show family → PDF → share and accept queued; back online syncs once, no duplicates", async ({ page, context }, testInfo) => {
  test.setTimeout(180_000);
  await signIn(page, "admin");
  await openControlled(page);

  await context.setOffline(true);
  // The page itself comes from the service worker with no signal.
  await page.reload();
  await expect(page.getByLabel("Customer display name")).toBeVisible();
  await page.getByLabel("Customer display name").fill("Mrs Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567890");
  await page.getByRole("button", { name: "Save draft and price" }).click();

  // Live pricing on the tablet: same totals the API gives for this draft (₹24,999 with the synthetic list).
  await expect(page.getByTestId("total-essential")).toContainText("₹24,999");
  await expect(page.locator('[data-status="offline"]')).toContainText("No signal: priced on this tablet");
  const badge = page.getByTestId("sync-badge");
  await expect(badge).toHaveText("Waiting for signal: 1 item");
  await page.getByTestId("component-two-way-lock").getByRole("radio", { name: "Add-on", exact: true }).check();
  await expect(page.getByTestId("total-addon")).toContainText("₹24,999");
  await expect(page.getByTestId("total-essential")).toContainText("₹23,999");
  await expect(badge).toHaveText("Waiting for signal: 1 item"); // edits replace the queued save

  // Show family, from the tablet's copy of the template.
  await page.getByTestId("show-family").click();
  const family = page.getByTestId("family-view");
  await expect(family.getByTestId("family-page-1")).toContainText("Prepared for Mrs Example");
  await page.getByTestId("family-close").click();

  // The PDF, made on the tablet.
  const [pdf] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-pdf").click()]);
  expect(pdf.suggestedFilename()).toMatch(/^Mason-Proposal-\d{4}-\d{2}-\d{2}\.pdf$/);
  const pdfPath = testInfo.outputPath("offline.pdf");
  await pdf.saveAs(pdfPath);
  expect((await import("node:fs")).readFileSync(pdfPath).subarray(0, 5).toString()).toBe("%PDF-");

  // Share: queued; the PDF is ready now, the link follows once the share syncs.
  await page.getByTestId("share-start").click();
  await page.getByTestId("share-confirm-yes").click();
  await expect(page.getByTestId("share-link-pending")).toBeVisible({ timeout: 30_000 });
  await expect(badge).toHaveText("Waiting for signal: 2 items");

  // Customer accepts Essential + Add-on: queued too.
  await page.getByTestId("accept-addon").click();
  await expect(page.getByTestId("accept-confirm")).toContainText("₹24,999");
  await page.getByTestId("accept-confirm-yes").click();
  await expect(page.getByTestId("accept-done")).toBeVisible();
  await expect(badge).toHaveText("Waiting for signal: 3 items");
  expect(await writes(page)).toEqual([]); // nothing reached the API while offline

  // Back online: everything syncs, in order, once.
  await context.setOffline(false);
  await expect(badge).toHaveCount(0, { timeout: 45_000 });
  await expect(page.getByTestId("share-link")).toHaveValue(/\/p\/[A-Za-z0-9_-]{22}$/);
  await expect(page.getByTestId("open-payments-case")).toHaveAttribute("href", /^\/crm\/payments\/[0-9a-f-]{36}$/);
  const expected = ["POST /api/v1/internal/proposals", "POST /api/v1/internal/proposals/:id/price", "POST /api/v1/internal/proposals/:id/share", "POST /api/v1/internal/proposals/:id/accept"];
  expect(await summary(page)).toEqual(expected);
  const created = (await writes(page))[0];
  expect(created.body).toMatchObject({ zohoLeadId: "1234567890", displayName: "Mrs Example" });
  expect((created.body as { items: { component: string; tier: string }[] }).items.find((item) => item.component === "two-way-lock")?.tier).toBe("addon");

  // Another online event and a reload send nothing again.
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await page.waitForTimeout(2_000);
  await page.reload();
  await page.waitForTimeout(2_000);
  expect(await summary(page)).toEqual(expected);

  // The service worker caches hold no customer data (the builder page was cached before anything was typed).
  const leaked = await page.evaluate(async () => {
    const found: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        if (/zohoLeadId|\/p\//.test(request.url)) found.push(request.url);
        const response = await cache.match(request);
        const type = response?.headers.get("content-type") ?? "";
        if (/text|json|javascript/.test(type) && /Mrs Example|1234567890/.test(await response!.text())) found.push(request.url);
      }
    }
    return found;
  });
  expect(leaked).toEqual([]);
});

test("offline: the server re-prices on sync and staff are told when its totals differ", async ({ page, context }) => {
  test.setTimeout(120_000);
  await signIn(page, "agent");
  await openControlled(page);
  await context.setOffline(true);
  await page.getByLabel("Customer display name").fill("Mr Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567891");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹24,999");
  await mock(page, "/__price-delta", { paise: 10_000 }); // ₹100 a unit more on the server: 19 units → ₹26,149 → ₹26,999
  await context.setOffline(false);
  await expect(page.getByTestId("sync-badge")).toHaveCount(0, { timeout: 45_000 });
  await expect(page.getByTestId("total-essential")).toContainText("₹26,999");
  await expect(page.getByTestId("sync-notice")).toContainText("re-priced");
  // Back online, edits price on the server again (the draft is now a server draft: PATCH, never a second create).
  await page.getByRole("button", { name: "More bathrooms" }).click();
  await expect.poll(async () => (await summary(page)).filter((line) => line === "PATCH /api/v1/internal/proposals/:id").length).toBe(1);
  expect((await summary(page)).filter((line) => line === "POST /api/v1/internal/proposals")).toHaveLength(1);
});

test("offline: without the price list on the tablet, no price is guessed", async ({ page, context }) => {
  await mock(page, "/__no-price-list");
  await signIn(page, "agent");
  await openControlled(page);
  await context.setOffline(true);
  await page.getByLabel("Customer display name").fill("Mr Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567892");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Offline pricing needs the price list" }).first()).toBeVisible();
  await expect(page.getByTestId("total-essential")).toContainText("—");
  await expect(page.getByTestId("show-family")).toBeDisabled();
});

test("accept online (admin): confirm, share + accept, then the payments case opens", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/crm/proposals/new");
  await page.getByLabel("Customer display name").fill("Mrs Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567893");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹24,999");
  await expect(page.getByTestId("accept-panel")).toHaveCount(0); // only after Show family
  await page.getByTestId("show-family").click();
  await page.getByTestId("family-close").click();
  await expect(page.getByTestId("accept-addon")).toHaveCount(0); // no add-ons, one option
  await page.getByTestId("accept-essential").click();
  await expect(page.getByTestId("accept-confirm")).toContainText("This also shares the proposal");
  await page.getByTestId("accept-confirm-yes").click();
  await page.waitForURL(/\/crm\/payments\/[0-9a-f-]{36}$/);
  const lines = await summary(page);
  expect(lines.slice(-2)).toEqual(["POST /api/v1/internal/proposals/:id/share", "POST /api/v1/internal/proposals/:id/accept"]);
  expect((await writes(page)).at(-1)?.body).toEqual({ option: "essential" });
});

test("accept: the API's refusal is shown (today mason-api lets only an admin accept)", async ({ page }) => {
  await signIn(page, "agent");
  await page.goto("/crm/proposals/new");
  await page.getByLabel("Customer display name").fill("Mr Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567894");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹24,999");
  await page.getByTestId("show-family").click();
  await page.getByTestId("family-close").click();
  await page.getByTestId("accept-essential").click();
  await page.getByTestId("accept-confirm-yes").click();
  await expect(page.getByTestId("accept-error")).toHaveText("Only an admin can accept a proposal.");
});

test("lost: reason picklist, note required for Other, confirmation, then closed", async ({ page }) => {
  await signIn(page, "agent");
  await page.goto("/crm/proposals/new");
  await page.getByLabel("Customer display name").fill("Ms Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567895");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹24,999");
  await page.getByTestId("lost-start").click();
  const submit = page.getByTestId("lost-submit");
  await expect(submit).toBeDisabled();
  await page.getByTestId("lost-reason").selectOption("other");
  await expect(submit).toBeDisabled();
  await page.getByTestId("lost-note").fill("Moving city next month");
  await submit.click();
  await expect(page.getByTestId("lost-confirm")).toBeVisible();
  await submit.click();
  await expect(page.getByTestId("lost-done")).toContainText("Reason: Other. Moving city next month");
  expect((await writes(page)).at(-1)).toMatchObject({ method: "POST", body: { reason: "other", note: "Moving city next month" } });
  await expect(page.getByTestId("share-start")).toBeDisabled();
  await expect(page.locator('section[aria-labelledby="proposal-customer"]')).toHaveAttribute("inert", "");
});

test("lost: until mason-api has the endpoint, staff see it is not available (nothing is lost silently)", async ({ page }) => {
  await mock(page, "/__no-lost");
  await signIn(page, "agent");
  await page.goto("/crm/proposals/new");
  await page.getByLabel("Customer display name").fill("Ms Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567896");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹24,999");
  await page.getByTestId("lost-start").click();
  await page.getByTestId("lost-reason").selectOption("price");
  await page.getByTestId("lost-submit").click();
  await page.getByTestId("lost-submit").click();
  await expect(page.getByTestId("lost-error")).toHaveText("Marking a proposal lost is not available on the server yet.");
  await expect(page.getByTestId("lost-done")).toHaveCount(0);
});

test("logout clears the offline data: queue, open proposal and every proposals cache", async ({ page, context }) => {
  await signIn(page, "agent");
  await openControlled(page);
  await context.setOffline(true);
  await page.getByLabel("Customer display name").fill("Mr Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567897");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("sync-badge")).toHaveText("Waiting for signal: 1 item");
  await context.setOffline(false);
  await expect(page.getByTestId("sync-badge")).toHaveCount(0, { timeout: 45_000 });
  const signOut = page.getByRole("button", { name: "Sign out" });
  await signOut.evaluate((button: HTMLButtonElement) => button.click()); // the sidebar may be collapsed on small screens
  await page.waitForURL(/\/crm\/login/);
  const left = await page.evaluate(async () => ({
    caches: (await caches.keys()).filter((name) => name.startsWith("mason-proposals-")),
    databases: (await indexedDB.databases()).map((db) => db.name).filter((name) => name === "mason-proposals-offline")
  }));
  expect(left).toEqual({ caches: [], databases: [] });
});
