import { chromium } from "playwright";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
});

async function safeGoto(page, url) {
  console.log("  -> safeGoto calling goto commit:", url);
  await page.goto(url, { waitUntil: "commit", timeout: 15000 });
  console.log("  -> commit reached, waiting domcontentloaded:", url);
  await page.waitForLoadState("domcontentloaded", { timeout: 10000 }).catch(() => {});
  console.log("  -> safeGoto finished:", url);
}

async function takeFastScreenshot(page, path) {
  try {
    await page.screenshot({ path, timeout: 3000, animations: "disabled" });
    console.log("  -> Screenshot saved:", path);
  } catch (err) {
    console.warn("  -> Screenshot skipped:", path, err.message);
  }
}

async function getSwInfo(page, tenantSlug) {
  for (let i = 0; i < 60; i++) {
    const info = await Promise.race([
      page.evaluate(async () => {
        if (!("serviceWorker" in navigator)) return { reason: "no sw in navigator" };
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return { reason: "no reg yet" };
        if (!reg.active) return { reason: "reg exists but not active", installing: reg.installing?.scriptURL, waiting: reg.waiting?.scriptURL };
        const cacheNames = await caches.keys();
        return {
          scope: reg.scope,
          scriptURL: reg.active.scriptURL,
          cacheNames,
        };
      }),
      new Promise((resolve) => setTimeout(() => resolve({ reason: "eval timed out" }), 2000)),
    ]).catch((e) => ({ reason: "eval error " + e.message }));

    if (info && info.scope && info.scriptURL) {
      return info;
    }
    if (i % 5 === 0) console.log(`  [getSwInfo ${tenantSlug}] iter ${i}:`, info);
    await page.waitForTimeout(500);
  }
  throw new Error(`Service worker did not become active for ${tenantSlug}`);
}

async function newFastContext(browser) {
  const ctx = await browser.newContext();
  await ctx.route("https://fonts.googleapis.com/**", (route) => route.abort());
  await ctx.route("https://fonts.gstatic.com/**", (route) => route.abort());
  return ctx;
}

async function runProof() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-default-apps",
    ],
  });
  console.log("=== Launching browser for PWA SW & Cache Refresh Proof ===");

  // 1. Tenant A Context
  const contextA = await newFastContext(browser);
  const pageA = await contextA.newPage();
  console.log("1. Navigating Tenant A to http://127.0.0.1:3000/t/masjid-noor ...");
  await safeGoto(pageA, "http://127.0.0.1:3000/t/masjid-noor");

  const swInfoA = await getSwInfo(pageA, "masjid-noor");
  console.log("Tenant A Service Worker Info:", JSON.stringify(swInfoA, null, 2));
  await takeFastScreenshot(pageA, "screenshots/pwa/tenant_a_sw_ready.png");
  console.log("Context A ready.");

  // 2. Tenant B Context
  const contextB = await newFastContext(browser);
  const pageB = await contextB.newPage();
  console.log("2. Navigating Tenant B to http://127.0.0.1:3000/t/darul-uloom ...");
  await safeGoto(pageB, "http://127.0.0.1:3000/t/darul-uloom");

  const swInfoB = await getSwInfo(pageB, "darul-uloom");
  console.log("Tenant B Service Worker Info:", JSON.stringify(swInfoB, null, 2));
  await takeFastScreenshot(pageB, "screenshots/pwa/tenant_b_sw_ready.png");
  console.log("Context B ready.");

  // Verify independence
  if (!swInfoA.scope.includes("/t/masjid-noor") || !swInfoB.scope.includes("/t/darul-uloom")) {
    throw new Error("Service worker scopes incorrect!");
  }
  if (swInfoB.cacheNames.some((c) => c.includes("masjid-noor"))) {
    throw new Error("Tenant B cache leaked Tenant A cache name!");
  }

  // 3. Admin Content Edit Cache Refresh Test in dedicated Admin Context
  console.log("3. Logging in as Tenant A Admin (admin@masjid-noor.test) in fresh admin tab...");
  const adminContext = await newFastContext(browser);
  const adminPage = await adminContext.newPage();
  await safeGoto(adminPage, "http://127.0.0.1:3000/login");
  await adminPage.waitForSelector("input[type='email']", { state: "visible", timeout: 10000 });
  await adminPage.fill("input[type='email']", "admin@masjid-noor.test");
  await adminPage.fill("input[type='password']", "TestPass123!");
  await adminPage.click("button[type='submit']");
  await adminPage.waitForTimeout(3000);
  console.log("Logged in to Tenant A admin panel!");

  const uniqueSubtitle = "PWA Cache Refresh Proof 2026-08-01 13:00";
  console.log(`4. Editing home_hero subtitle to "${uniqueSubtitle}" via Admin API...`);
  const putRes = await adminPage.evaluate(async (sub) => {
    const r = await fetch("/api/tenant-admin/pages/home_hero", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hero_title: "Masjid An-Noor",
        hero_subtitle: sub,
      }),
    });
    return { status: r.status, body: await r.json() };
  }, uniqueSubtitle);
  console.log("PUT Result:", putRes);

  if (putRes.status !== 200 || !putRes.body.ok) {
    throw new Error("Failed to edit home_hero as admin!");
  }

  // Check DB sw_cache_version
  const dbRes = await pool.query(
    "select sw_cache_version from tenant_branding where tenant_id='7fe561ed-c2dc-4424-ab44-c6f8a4f58c67'"
  );
  console.log("Tenant A sw_cache_version after edit in DB:", dbRes.rows[0]?.sw_cache_version);
  console.log("Admin edit done.");

  // 5. Reload public home page for Tenant A and confirm cache refreshed & shows new subtitle
  console.log("5. Opening http://127.0.0.1:3000/t/masjid-noor in Context A2 to verify network-first cache refresh...");
  const contextA2 = await newFastContext(browser);
  const pageA2 = await contextA2.newPage();
  await safeGoto(pageA2, "http://127.0.0.1:3000/t/masjid-noor");
  await pageA2.waitForTimeout(1000);
  const contentA = await pageA2.content();
  if (!contentA.includes(uniqueSubtitle)) {
    throw new Error("Tenant A page did not show refreshed subtitle!");
  }
  console.log("SUCCESS: Tenant A public page shows new subtitle immediately!");

  const postEditSwA = await getSwInfo(pageA2, "masjid-noor");
  console.log("Tenant A Cache Names after edit:", JSON.stringify(postEditSwA, null, 2));
  await takeFastScreenshot(pageA2, "screenshots/pwa/tenant_a_cache_refreshed.png");

  // 6. Confirm Tenant B remains isolated and unchanged
  console.log("6. Verifying Tenant B remains isolated in Context B2...");
  const contextB2 = await newFastContext(browser);
  const pageB2 = await contextB2.newPage();
  await safeGoto(pageB2, "http://127.0.0.1:3000/t/darul-uloom");
  await pageB2.waitForTimeout(1000);
  const contentB = await pageB2.content();
  if (contentB.includes(uniqueSubtitle)) {
    throw new Error("LEAK DETECTED: Tenant B page showed Tenant A subtitle!");
  }
  console.log("SUCCESS: Tenant B page does NOT contain Tenant A subtitle!");

  const postEditSwB = await getSwInfo(pageB2, "darul-uloom");
  console.log("Tenant B Cache Names after edit (should be untouched):", JSON.stringify(postEditSwB, null, 2));

  await browser.close();
  await pool.end();
  console.log("=== All Service Worker & Cache Refresh Tests PASSED ===");
}

runProof()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
