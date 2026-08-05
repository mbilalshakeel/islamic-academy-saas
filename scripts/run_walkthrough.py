#!/usr/bin/env python3
"""40-route public walkthrough: 20 public routes x 2 tenants, HTTP 200 + no error text."""
import urllib.request, urllib.error

BASE = "http://127.0.0.1:3000"
TENANTS = {
    "masjid-noor": "Tenant A (Masjid An-Noor)",
    "darul-uloom": "Tenant B (Darul Uloom Academy)",
}

ROUTES = [
    "/",
    "/quran/16-line",
    "/quran/16-line/1",
    "/quran/15-line",
    "/qaida",
    "/names/allah",
    "/names/prophet",
    "/duas",
    "/duas/masnoon",
    "/hadith",
    "/pillars",
    "/prayers",
    "/books",
    "/qa",
    "/about",
    "/contact",
    "/tools/sehri-iftar",
    "/tools/dhikr",
    "/tools/calendar",
    "/tools/zakat",
]

ERROR_MARKERS = ["An error occurred", "Application error", "Internal Server Error", "This application failed"]

passed = 0
failed = 0
results = []

for slug, label in TENANTS.items():
    for route in ROUTES:
        url = f"{BASE}/t/{slug}{route}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "walkthrough"})
            with urllib.request.urlopen(req, timeout=30) as resp:
                status = resp.status
                body = resp.read().decode("utf-8", errors="ignore")
            err_text = any(m in body for m in ERROR_MARKERS)
            ok = (status == 200) and not err_text
            status_str = "PASS" if ok else "FAIL"
            if ok:
                passed += 1
            else:
                failed += 1
            results.append((slug, route, status, err_text))
            print(f"  {status_str}  {slug}  {route}  -> HTTP {status}" + (" [error-text]" if err_text else ""))
        except Exception as e:
            failed += 1
            results.append((slug, route, "ERR", True))
            print(f"  FAIL  {slug}  {route}  -> {e}")

print("\n" + "=" * 60)
print(f"TOTAL: {passed} passed, {failed} failed  (across {len(TENANTS)*len(ROUTES)} requests)")
print("=" * 60)
raise SystemExit(0 if failed == 0 else 1)
