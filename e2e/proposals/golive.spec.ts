import { expect, test, type Page } from "@playwright/test";

/* Proposal go-live hardening (web): signed server-side calls, and the Zoho note chip. Synthetic data only. */
const API = "http://127.0.0.1:4410";
type LogEntry = { method: string; path: string; token?: string; signed?: boolean; signatureSent?: boolean };
const log = async (page: Page): Promise<LogEntry[]> => (await (await page.request.get(`${API}/__log`)).json()).data;

test.beforeEach(async ({ request }) => { await request.post(`${API}/__reset`); });

test("the customer page's view call to the API is signed; the browser's events are not (the secret stays on the server)", async ({ page }) => {
  await page.goto("/p/GoldenQuoteB0000000000");
  await expect(page.getByTestId("proposal-page-1")).toBeVisible();
  await expect.poll(async () => (await log(page)).some((entry) => entry.path === "/api/v1/public/proposals/:token/events")).toBe(true);
  const entries = await log(page);
  const views = entries.filter((entry) => entry.path === "/api/v1/public/proposals/:token");
  expect(views.length).toBeGreaterThan(0);
  expect(views.every((entry) => entry.signed === true)).toBe(true); // verified by the mock exactly as mason-api does
  const events = entries.filter((entry) => entry.path === "/api/v1/public/proposals/:token/events");
  expect(events.every((entry) => entry.signatureSent === false)).toBe(true);
  // Nothing about signing reaches the page.
  const html = await page.content();
  expect(html).not.toMatch(/x-mason-web|e2e-only-proposals-web-signing/);
});

test("share: a 'pending' Zoho note shows as a neutral chip, not an error", async ({ page }) => {
  await page.context().addCookies([{ name: "mason-crm-session", value: "e2e-agent", url: "http://127.0.0.1:3410" }]);
  await page.request.post(`${API}/__zoho-note`, { data: { value: "pending" } });
  await page.goto("/crm/proposals/new");
  await page.getByLabel("Customer display name").fill("Mrs Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567899");
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹24,999");
  await page.getByTestId("share-start").click();
  await page.getByTestId("share-confirm-yes").click();
  await expect(page.getByTestId("share-ready")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("zoho-note-chip")).toHaveText("Zoho note pending");
  await expect(page.getByTestId("share-error")).toHaveCount(0);
});
