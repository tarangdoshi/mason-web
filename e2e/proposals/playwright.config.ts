import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/* Proposal Builder staff screen and customer page at tablet sizes (plus one phone), against a synthetic mock API.
   Copy comes from the bundled approved seed (PROPOSALS_CONTENT_SOURCE=seed), never from Sanity.
   The golden visual test (@golden) runs once, at A4 scale, against the approved 20 Nov page 1.
   Two Next dev servers: one with NEXT_PUBLIC_PROPOSALS_ENABLED=true, one with it off (must 404).
   Run: pnpm test:e2e:proposals */

const ROOT = path.resolve(__dirname, "../..");
const MOCK_PORT = 4410;
const ON_PORT = 3410;
const OFF_PORT = 3411;
const api = `http://127.0.0.1:${MOCK_PORT}`;
// Synthetic, test-only (not a real secret): the mock verifies the customer page's signed calls with it.
const E2E_SIGNING_SECRET = "e2e-only-proposals-web-signing-secret-0000";
const nextServer = (port: number, enabled: boolean) => ({
  command: `pnpm exec next dev -p ${port}`,
  cwd: ROOT,
  url: `http://127.0.0.1:${port}/crm/login`,
  timeout: 180_000,
  reuseExistingServer: false,
  env: {
    AEGIS_DIST_DIR: `.next-e2e-proposals-${enabled ? "on" : "off"}`,
    NEXT_PUBLIC_API_URL: api,
    NEXT_PUBLIC_PROPOSALS_ENABLED: enabled ? "true" : "false",
    PROPOSALS_CONTENT_SOURCE: "seed",
    PROPOSALS_SHARE_ORIGIN: `http://127.0.0.1:${port}`,
    NEXT_PUBLIC_PROPOSALS_SW_DEV: "true", // the service worker on a dev server, for the offline test
    PROPOSALS_WEB_SIGNING_SECRET: E2E_SIGNING_SECRET,
    NEXT_TELEMETRY_DISABLED: "1"
  }
});

// Chromium for every profile (WebKit is not installed in CI or locally); viewport, touch and UA follow the device.
const chromium = (device: (typeof devices)[string]) => ({ ...device, browserName: "chromium" as const, defaultBrowserType: "chromium" as const });

export default defineConfig({
  testDir: ".",
  outputDir: "../../test-results/proposals",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://127.0.0.1:${ON_PORT}`, trace: "retain-on-failure" },
  metadata: { offBaseURL: `http://127.0.0.1:${OFF_PORT}`, api },
  projects: [
    { name: "ipad-portrait", use: chromium(devices["iPad (gen 7)"]), grepInvert: /@golden/ },
    { name: "ipad-landscape", use: chromium(devices["iPad (gen 7) landscape"]), grepInvert: /@golden/ },
    { name: "android-tablet", use: chromium(devices["Galaxy Tab S4"]), grepInvert: /@golden/ },
    { name: "android-phone", use: chromium(devices["Pixel 7"]), grepInvert: /@golden/ },
    { name: "a4-golden", use: { browserName: "chromium", viewport: { width: 1280, height: 1400 }, deviceScaleFactor: 1 }, grep: /@golden/ }
  ],
  webServer: [
    { command: `node --import tsx e2e/proposals/mock-api.mjs`, cwd: ROOT, url: `${api}/__log`, env: { MOCK_API_PORT: String(MOCK_PORT), PROPOSALS_WEB_SIGNING_SECRET: E2E_SIGNING_SECRET }, reuseExistingServer: false, timeout: 20_000 },
    nextServer(ON_PORT, true),
    nextServer(OFF_PORT, false)
  ]
});
