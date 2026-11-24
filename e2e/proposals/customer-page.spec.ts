import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/* Customer proposal page /p/[token], "Show family", browser PDF and share. Synthetic data only
   ("Mrs Example" etc., made-up tokens); quote B is the golden 20 Nov quote (docs/proposals/golden-quotes.md). */
const API = "http://127.0.0.1:4410";
const OFF = "http://127.0.0.1:3411";
const GOLDEN = "GoldenQuoteB0000000000";
const QUOTE_A = "QuoteAExample000000000";
const NO_ADDON = "NoAddonExample00000000";

type LogEntry = { method: string; path: string; token?: string; body?: Record<string, unknown>; cookie?: string | null; contentType?: string | null };
async function log(page: Page): Promise<LogEntry[]> {
  return (await (await page.request.get(`${API}/__log`)).json()).data;
}
const events = async (page: Page) => (await log(page)).filter((entry) => entry.path === "/api/v1/public/proposals/:token/events");
async function signIn(page: Page, role: "admin" | "agent") {
  await page.context().addCookies([{ name: "mason-crm-session", value: `e2e-${role}`, url: "http://127.0.0.1:3410" }]);
}

test.beforeEach(async ({ request }) => { await request.post(`${API}/__reset`); });

test("@golden page 1 matches the approved 20 Nov design (quote B)", async ({ page }) => {
  await page.goto(`/p/${GOLDEN}`);
  await page.evaluate(() => document.fonts.ready);
  const first = page.getByTestId("proposal-page-1");
  await expect(first).toHaveScreenshot("approved-2026-11-20-page1.png", {
    // The reference is the approved PDF's page 1 with the customer's name line painted out in this colour.
    mask: [page.getByTestId("proposal-eyebrow")],
    maskColor: "#FF00FF",
    animations: "disabled",
    threshold: 0.2,
    // Measured: ~3.3% of pixels differ, all text anti-aliasing (PDF rasteriser vs Chromium); a moved block is far more.
    maxDiffPixelRatio: 0.04
  });
});

test("customer page: three pages, approved copy, no customer data in title, never indexed", async ({ page }) => {
  const response = await page.goto(`/p/${GOLDEN}`);
  expect(response?.status()).toBe(200);
  const headers = response!.headers();
  expect(headers["x-robots-tag"]).toContain("noindex");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  await expect(page).toHaveTitle("Your proposal | Mason Company");
  expect(await page.title()).not.toContain("Example");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  for (const n of [1, 2, 3]) await expect(page.getByTestId(`proposal-page-${n}`)).toBeVisible();

  await expect(page.getByTestId("proposal-eyebrow")).toHaveText("Prepared for Mrs Example");
  const essential = page.getByTestId("proposal-option-essential");
  await expect(essential).toContainText("₹13,999");
  await expect(essential).toContainText("Vertical grab bars × 2 (1 short, 1 long)");
  await expect(essential).toContainText("Installation manpower (Mason-trained technicians)");
  const addon = page.getByTestId("proposal-option-addon");
  await expect(addon).toContainText("Essential + Safety Add-on");
  await expect(addon).toContainText("Two-way lock");
  // No per-item prices for the add-on: the card's only price is the package total.
  expect((await addon.innerText()).match(/₹/g)).toHaveLength(1);
  // Benefit lines from the component library; a declined item never appears.
  await expect(page.getByTestId("doc-item-vertical-grab-bars")).toContainText("1 short and 1 long. Support at key standing and movement points.");
  await expect(page.getByText("Raised Toilet Seat")).toHaveCount(0);
  await expect(page.getByText(/CMO TO WRITE/)).toHaveCount(0);
  await expect(page.getByTestId("proposal-disclaimer")).toContainText("They are not a substitute for diagnosis");
  await expect(page.getByTestId("proposal-page-3")).toContainText("What happens next");
});

test("complimentary items are marked, and a proposal without an add-on has one option", async ({ page }) => {
  await page.goto(`/p/${QUOTE_A}`);
  const essential = page.getByTestId("proposal-option-essential");
  await expect(essential).toContainText("Vertical grab bars × 3 (2 short, 1 long)");
  await expect(essential.getByText("Complimentary")).toHaveCount(2);
  await expect(essential).toContainText("EVA non-slip Bathroom slippers");
  await expect(essential).toContainText("Drainage clearance × 4");
  // A component without an approved benefit line shows its name only, never the CMO placeholder.
  await expect(page.getByTestId("doc-item-folding-bar")).not.toContainText("CMO");

  // Staff may clear the date: the page still renders, with "Proposal" and no dangling separator.
  const noDate = await page.goto("/p/NoDateExample000000000");
  expect(noDate?.status()).toBe(200);
  await expect(page.getByTestId("proposal-page-1")).toContainText("Proposal");
  await expect(page.getByTestId("proposal-page-1")).not.toContainText("Proposal ·");

  await page.goto(`/p/${NO_ADDON}`);
  await expect(page.getByTestId("proposal-option-addon")).toHaveCount(0);
  await expect(page.getByTestId("proposal-disclaimer")).toBeVisible();
});

test("the longest proposal still fits three A4 pages, disclaimer included", async ({ page }) => {
  await page.goto("/p/AllItemsExample0000000");
  await expect(page.getByTestId("proposal-document")).toHaveAttribute("data-density", "compact");
  if (page.viewportSize()!.width >= 834) {
    for (const n of [1, 2, 3]) {
      const height = await page.getByTestId(`proposal-page-${n}`).evaluate((element) => element.scrollHeight);
      expect(height, `page ${n}`).toBe(1123);
    }
  }
  await expect(page.getByTestId("proposal-disclaimer")).toBeVisible();
  await expect(page.getByTestId("proposal-option-essential")).toContainText("Reinforced fixture support");
});

test("unknown, malformed and flag-off tokens are a plain 404", async ({ page }) => {
  for (const path of ["/p/Unknown000000000000000", "/p/short", "/p/has%20space00000000000000"]) {
    const response = await page.goto(path);
    expect(response?.status(), path).toBe(404);
    await expect(page.locator("body")).not.toContainText("Example");
  }
  const off = await page.goto(`${OFF}/p/${GOLDEN}`);
  expect(off?.status()).toBe(404);
  expect((await events(page)).length).toBe(0);
});

test("viewer events: opened, 15 s heartbeats, option chosen; no cookies", async ({ page, context }) => {
  await context.addCookies([{ name: "tracker", value: "must-not-be-sent", url: API }]);
  await page.clock.install();
  await page.goto(`/p/${GOLDEN}`);
  await expect.poll(async () => (await events(page)).map((entry) => entry.body?.type)).toEqual(["opened"]);

  await page.clock.fastForward(15_000);
  await expect.poll(async () => (await events(page)).filter((entry) => entry.body?.type === "viewed").length).toBe(1);
  const viewed = (await events(page)).find((entry) => entry.body?.type === "viewed")!;
  expect(viewed.body?.durationMs).toBeGreaterThanOrEqual(14_000);
  expect(viewed.body?.durationMs).toBeLessThanOrEqual(16_000);

  await page.getByTestId("proposal-option-addon").click();
  await expect(page.getByTestId("proposal-option-addon")).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await events(page)).at(-1)?.body).toEqual({ type: "option_chosen", option: "addon" });

  for (const entry of await events(page)) {
    expect(entry.token).toBe(GOLDEN);
    expect(entry.cookie).toBeNull();
    expect(entry.contentType).toContain("text/plain");
  }
  // The page itself sets no cookies.
  expect((await context.cookies()).map((cookie) => cookie.name)).toEqual(["tracker"]);
});

test("Do Not Track: no heartbeats, but opened and option chosen are still sent", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(Navigator.prototype, "doNotTrack", { get: () => "1" }));
  await page.clock.install();
  await page.goto(`/p/${GOLDEN}`);
  await expect.poll(async () => (await events(page)).length).toBe(1);
  await page.clock.fastForward(46_000);
  await page.getByTestId("proposal-option-essential").click();
  await expect.poll(async () => (await events(page)).map((entry) => entry.body?.type)).toEqual(["opened", "option_chosen"]);
});

test("layout: stacked on phones, A4 on tablets, never sideways scroll", async ({ page }, testInfo) => {
  await page.goto(`/p/${GOLDEN}`);
  const viewport = page.viewportSize()!;
  const first = (await page.getByTestId("proposal-page-1").boundingBox())!;
  const second = (await page.getByTestId("proposal-page-2").boundingBox())!;
  expect(second.y).toBeGreaterThan(first.y + first.height - 1); // pages stack vertically
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
  if (viewport.width >= 834) expect(Math.round(first.width)).toBe(794); // A4 at full size (tablet landscape)
  else if (viewport.width >= 600) expect(first.height / first.width).toBeCloseTo(1123 / 794, 2); // A4, scaled
  else expect(first.height / first.width).not.toBeCloseTo(1123 / 794, 1); // phone: reflowed, not A4
  await page.screenshot({ path: testInfo.outputPath("customer-page.png"), fullPage: false });
});

test("staff: Show family is full screen with no staff controls and keeps the screen awake", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __wake: { requested: number; released: number } };
    w.__wake = { requested: 0, released: 0 };
    Object.defineProperty(Navigator.prototype, "wakeLock", {
      get: () => ({ request: async () => { w.__wake.requested += 1; return { release: async () => { w.__wake.released += 1; } }; } })
    });
  });
  await signIn(page, "admin");
  await page.goto("/crm/proposals/new");
  await page.getByLabel("Customer display name").fill("Mrs Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567890");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹");
  await page.getByTestId("show-family").click();

  const family = page.getByTestId("family-view");
  await expect(family).toBeVisible();
  await expect(family.getByTestId("family-page-1")).toContainText("Prepared for Mrs Example");
  // Only the quiet close control: no totals, override, share or CRM navigation inside the view.
  await expect(family.getByRole("button")).toHaveCount(1);
  await expect(family.getByText(/override|Share with customer|Totals/i)).toHaveCount(0);
  const box = (await family.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(Math.round(box.width)).toBe(viewport.width);
  expect(Math.round(box.height)).toBe(viewport.height);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __wake: { requested: number } }).__wake.requested)).toBeGreaterThan(0);
  // Nothing of the staff screen is on top of it (the element at each corner and the centre belongs to the view).
  const onTop = await page.evaluate(() => {
    const view = document.querySelector('[data-testid="family-view"]')!;
    const points = [[5, 5], [window.innerWidth - 5, 5], [5, window.innerHeight - 5], [window.innerWidth - 5, window.innerHeight - 5], [window.innerWidth / 2, window.innerHeight / 2]];
    return points.every(([x, y]) => view.contains(document.elementFromPoint(x, y)));
  });
  expect(onTop).toBe(true);

  await page.getByTestId("family-close").click();
  await expect(family).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => (window as unknown as { __wake: { released: number } }).__wake.released)).toBeGreaterThan(0);
});

test("staff: PDF is made in the browser, works offline, and the share falls back to download + link", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:3410" });
  await signIn(page, "admin");
  await page.goto("/crm/proposals/new");
  await page.getByLabel("Customer display name").fill("Mrs Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567890");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹");

  // Load once online (Show family), then make the PDF with the network off. Photos are inlined at load.
  await page.getByTestId("show-family").click();
  await expect(page.getByTestId("family-view").getByTestId("doc-item-angled-grab-bar").locator("img")).toHaveAttribute("src", /^data:image\//);
  await page.getByTestId("family-close").click();
  await context.setOffline(true);
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("download-pdf").click()]);
  await context.setOffline(false);
  expect(download.suggestedFilename()).toMatch(/^Mason-Proposal-\d{4}-\d{2}-\d{2}\.pdf$/);
  const file = testInfo.outputPath("proposal.pdf");
  await download.saveAs(file);
  const bytes = fs.readFileSync(file);
  const text = bytes.toString("latin1");
  expect(text.startsWith("%PDF-")).toBe(true);
  expect(text.match(/\/Type \/Page[^s]/g)).toHaveLength(3);
  expect(text).not.toContain("Example"); // the name is only ever pixels on the page, never PDF text or metadata
  expect(bytes.length).toBeGreaterThan(50_000);
  expect(bytes.length).toBeLessThan(6_000_000);

  // Share: confirm, the API shares (and logs SHARED), the draft locks; no native share in this browser → fallback.
  await page.getByTestId("share-start").click();
  await page.getByTestId("share-confirm-yes").click();
  await expect(page.getByTestId("share-ready")).toBeVisible({ timeout: 30_000 });
  expect((await log(page)).some((entry) => entry.method === "POST" && /\/share$/.test(entry.path))).toBe(true);
  await expect(page.getByTestId("share-send")).toHaveCount(0);
  const link = await page.getByTestId("share-link").inputValue();
  expect(link).toMatch(/^http:\/\/127\.0\.0\.1:3410\/p\/[A-Za-z0-9_-]{22}$/); // PROPOSALS_SHARE_ORIGIN, not the CRM host
  expect(link).not.toContain("Example");
  await page.getByTestId("share-copy").click();
  await expect(page.getByTestId("share-copy")).toHaveText("Link copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link);
  const [shareDownload] = await Promise.all([page.waitForEvent("download"), page.getByTestId("share-download").click()]);
  expect(shareDownload.suggestedFilename()).toMatch(/^Mason-Proposal-\d{4}-\d{2}-\d{2}\.pdf$/);
  await expect(page.getByText("This proposal is now locked")).toBeVisible();

  // The shared link opens the customer page.
  const customer = await context.newPage();
  await customer.goto(link);
  await expect(customer.getByTestId("proposal-eyebrow")).toHaveText("Prepared for Mrs Example");
});

test("staff: native share sends the PDF file, the link and the text", async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __shared: unknown[] };
    w.__shared = [];
    Object.defineProperty(Navigator.prototype, "canShare", { value: (data: { files?: File[] }) => Boolean(data.files?.length) });
    Object.defineProperty(Navigator.prototype, "share", {
      value: async (data: { files: File[]; url: string; text: string }) => { w.__shared.push({ name: data.files[0].name, type: data.files[0].type, size: data.files[0].size, url: data.url, text: data.text }); }
    });
  });
  await signIn(page, "agent");
  await page.goto("/crm/proposals/new");
  await page.getByLabel("Customer display name").fill("Mrs Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567890");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹");
  await page.getByTestId("share-start").click();
  await page.getByTestId("share-confirm-yes").click();
  await page.getByTestId("share-send").click();
  const shared = await page.evaluate(() => (window as unknown as { __shared: { name: string; type: string; size: number; url: string; text: string }[] }).__shared);
  expect(shared).toHaveLength(1);
  expect(shared[0].name).toMatch(/^Mason-Proposal-\d{4}-\d{2}-\d{2}\.pdf$/);
  expect(shared[0].type).toBe("application/pdf");
  expect(shared[0].size).toBeGreaterThan(50_000);
  expect(shared[0].url).toMatch(/\/p\/[A-Za-z0-9_-]{22}$/);
  expect(shared[0].text).not.toContain("Example");
});
