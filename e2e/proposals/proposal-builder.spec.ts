import { expect, test, type Page } from "@playwright/test";

/* Synthetic data only: "Mrs Example", lead 1234567890, mock prices. */
const API = "http://127.0.0.1:4410";
const OFF = "http://127.0.0.1:3411";

async function signIn(page: Page, role: "admin" | "agent", base = "http://127.0.0.1:3410") {
  await page.context().addCookies([{ name: "mason-crm-session", value: `e2e-${role}`, url: base }]);
}
async function lastPriced(page: Page) {
  const { data } = await (await page.request.get(`${API}/__log`)).json();
  const writes = data.filter((entry: { method: string; path: string }) => entry.method !== "GET" && /\/proposals(\/[0-9a-f-]+)?$/.test(entry.path));
  return writes.at(-1)?.body as { items: { component: string; state: string; qty: number; tier: string; variant: string | null }[]; rooms: number };
}
async function fillCustomer(page: Page) {
  await page.getByLabel("Customer display name").fill("Mrs Example");
  await page.getByLabel("Zoho Lead ID").fill("1234567890");
  await page.getByRole("button", { name: "Save draft and price" }).click();
}
async function writes(page: Page) {
  const { data } = await (await page.request.get(`${API}/__log`)).json();
  return data.filter((entry: { method: string }) => entry.method !== "GET");
}

test.beforeEach(async ({ request }) => { await request.post(`${API}/__reset`); });

test("flag off: the staff route 404s and the nav has no proposal link", async ({ page }) => {
  await signIn(page, "admin", OFF);
  const response = await page.goto(`${OFF}/crm/proposals/new`);
  expect(response?.status()).toBe(404);
  await page.goto(`${OFF}/crm/payments`);
  await expect(page.getByRole("link", { name: "New proposal" })).toHaveCount(0);
});

test("agent builds a proposal with live totals and never sees the override", async ({ page }, testInfo) => {
  await signIn(page, "agent");
  await page.goto("/crm/proposals/new");
  await expect(page.getByRole("heading", { name: "New proposal" })).toBeVisible();
  await expect(page.locator("[data-testid^=component-]")).toHaveCount(14);
  await expect(page.getByTestId("total-essential")).toContainText("—");

  // A slowly typed Zoho Lead ID is never saved half-way: nothing is written until staff press Save.
  await page.getByLabel("Customer display name").fill("Mrs Example");
  await page.getByLabel("Zoho Lead ID").pressSequentially("12345", { delay: 50 });
  await page.waitForTimeout(1_500);
  expect(await writes(page)).toEqual([]);
  await page.getByLabel("Zoho Lead ID").pressSequentially("67890", { delay: 50 });
  await page.getByRole("button", { name: "Save draft and price" }).click();
  await expect(page.getByTestId("total-essential")).toContainText("₹24,999");
  expect((await writes(page))[0]).toMatchObject({ method: "POST", path: "/api/v1/internal/proposals", body: { zohoLeadId: "1234567890" } });
  await expect(page.getByLabel("Zoho Lead ID")).toHaveAttribute("readonly", "");
  await expect(page.getByTestId("qty-vertical-grab-bars")).toHaveText("3");
  await expect(page.getByTestId("qty-drainage-solution")).toHaveText("4");
  await expect(page.getByTestId("total-addon")).toContainText("No add-ons");
  await expect(page.getByTestId("rooms-line")).toHaveText("Covers 1 bathroom. Other rooms: quoted after inspection.");
  await expect(page.getByTestId("admin-override")).toHaveCount(0);

  const row = (key: string) => page.getByTestId(`component-${key}`);
  await row("vertical-grab-bars").getByRole("radio", { name: "Declined", exact: true }).check();
  await row("folding-bar").getByRole("radio", { name: "Already present", exact: true }).check();
  await row("angled-grab-bar").getByRole("button", { name: /^More / }).click();
  await row("angled-grab-bar").getByPlaceholder("Variant (optional)").fill("Left hand");
  await row("two-way-lock").getByRole("radio", { name: "Add-on", exact: true }).check();
  await page.getByRole("button", { name: "More bathrooms" }).click();

  await expect(page.getByTestId("total-essential")).toContainText("₹20,999");
  await expect(page.getByTestId("total-addon")).toContainText("₹22,999");
  await expect(page.getByTestId("rooms-line")).toHaveText("Covers 2 bathrooms. Other rooms: quoted after inspection.");
  await expect(row("vertical-grab-bars").getByRole("button", { name: /^More / })).toBeHidden();

  const sent = await lastPriced(page);
  expect(sent.rooms).toBe(2);
  const byKey = Object.fromEntries(sent.items.map((item) => [item.component, item]));
  expect(sent.items).toHaveLength(14);
  expect(byKey["vertical-grab-bars"].state).toBe("declined");
  expect(byKey["folding-bar"].state).toBe("present");
  expect(byKey["angled-grab-bar"]).toMatchObject({ qty: 2, variant: "Left hand", tier: "essential" });
  expect(byKey["two-way-lock"].tier).toBe("addon");
  expect(JSON.stringify(sent)).not.toContain("1234567890"); // lead ID only on create, never in edits
  expect(byKey["drainage-solution"].qty).toBe(4);

  await page.screenshot({ path: testInfo.outputPath(`agent-${testInfo.project.name}.png`), fullPage: true });
});

test("admin override needs a reason and replaces the total", async ({ page }, testInfo) => {
  await signIn(page, "admin");
  await page.goto("/crm/proposals/new");
  await fillCustomer(page);
  await page.getByTestId("component-two-way-lock").getByRole("radio", { name: "Add-on", exact: true }).check();
  await expect(page.getByTestId("total-addon")).toContainText("₹25,999");

  const form = page.getByTestId("admin-override");
  await form.getByLabel("Essential (₹)").fill("17,500");
  const apply = form.getByRole("button", { name: "Apply override" });
  await form.getByLabel("Reason (required)").fill("too short");
  await expect(apply).toBeDisabled();
  await form.getByLabel("Reason (required)").fill("Founder-approved referral discount");
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(page.getByTestId("total-essential")).toContainText("₹17,500");
  await expect(page.getByTestId("override-applied")).toContainText("Founder-approved referral discount");

  await page.screenshot({ path: testInfo.outputPath(`admin-${testInfo.project.name}.png`), fullPage: true });
});

test("touch targets are at least 44 px and the page never scrolls sideways", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/crm/proposals/new");
  await fillCustomer(page);
  await expect(page.getByTestId("total-essential")).toContainText("₹");
  const offenders = await page.evaluate(() => {
    const root = document.querySelector("[class*=builder]")!;
    const targets = [
      ...root.querySelectorAll("button, input:not([type=radio]), textarea"),
      ...[...root.querySelectorAll("input[type=radio]")].map((radio) => radio.nextElementSibling!)
    ];
    return targets.flatMap((element) => {
      const box = element.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) return []; // hidden (declined rows)
      return box.height < 44 || box.width < 44 ? [`${element.tagName}.${element.getAttribute("aria-label") ?? element.textContent?.trim() ?? ""} ${Math.round(box.width)}×${Math.round(box.height)}`] : [];
    });
  });
  expect(offenders).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
