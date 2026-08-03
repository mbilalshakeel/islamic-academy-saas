import { NextResponse } from "next/server";
import { createSupabaseScopedAnonClient } from "@/lib/supabase/scoped-anon";
import { createPlainAnonClient } from "@/lib/supabase/plain-anon";

/**
 * Public (no-login-required) Sehri/Iftar timings route.
 *
 * tenant_id is NOT trusted blindly from the client — it is re-validated
 * via get_tenant_by_id() (a narrow, anon-grantable RPC, see migration
 * 026 — companion to get_tenant_by_slug()) to confirm it is a real,
 * active tenant before we ever mint a scoped-anon JWT for it. This uses
 * the plain, shared anon client (no more privilege than any browser
 * already has) — never service_role, since this route has no legitimate
 * need to bypass RLS at all.
 *
 * Once validated, all actual content reads/writes (tenant_settings,
 * aladhan_prayer_time_cache) go through createSupabaseScopedAnonClient(),
 * which carries no more Postgres privilege than the public anon key
 * already has — RLS still fully applies, scoped to this one tenant.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const dateParam = searchParams.get("date"); // YYYY-MM-DD, defaults to today

  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }

  const plainClient = createPlainAnonClient();
  const { data: tenantRows } = await plainClient.rpc("get_tenant_by_id", { p_tenant_id: tenantId });
  const tenantRow = tenantRows?.[0];

  if (!tenantRow) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const supabase = createSupabaseScopedAnonClient(tenantId);

  const { data: settings, error: settingsError } = await supabase
    .from("tenant_settings")
    .select("city, country, latitude, longitude, calculation_method")
    .single();

  if (settingsError || !settings) {
    return NextResponse.json({ error: "Could not load tenant settings" }, { status: 400 });
  }

  const hasLocation = (settings.city && settings.country) || (settings.latitude && settings.longitude);
  if (!hasLocation) {
    return NextResponse.json(
      { needs_location: true, message: "Set your city in Settings to see Sehri & Iftar timings." },
      { status: 200 }
    );
  }

  const date = dateParam || new Date().toISOString().slice(0, 10);

  // ── Check cache first (24h TTL) ──
  const { data: cached } = await supabase
    .from("aladhan_prayer_time_cache")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  const cacheIsFresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < 24 * 60 * 60 * 1000;

  if (cacheIsFresh) {
    return NextResponse.json({
      date,
      fajr: cached.fajr,
      maghrib: cached.maghrib,
      source: "cache",
      cached_at: cached.fetched_at,
    });
  }

  // ── Fetch fresh from Aladhan ──
  const [year, month, day] = date.split("-");
  const aladhanDate = `${day}-${month}-${year}`; // Aladhan expects DD-MM-YYYY

  let url: string;
  if (settings.latitude && settings.longitude) {
    url = `https://api.aladhan.com/v1/timings/${aladhanDate}?latitude=${settings.latitude}&longitude=${settings.longitude}&method=${settings.calculation_method}`;
  } else {
    url = `https://api.aladhan.com/v1/timingsByCity/${aladhanDate}?city=${encodeURIComponent(
      settings.city
    )}&country=${encodeURIComponent(settings.country)}&method=${settings.calculation_method}`;
  }

  let aladhanJson: any;
  try {
    const res = await fetch(url);
    aladhanJson = await res.json();
    if (aladhanJson.code !== 200) {
      throw new Error(aladhanJson.data || "Aladhan API error");
    }
  } catch (err) {
    if (cached) {
      return NextResponse.json({
        date,
        fajr: cached.fajr,
        maghrib: cached.maghrib,
        source: "stale_cache_fallback",
        cached_at: cached.fetched_at,
        warning: "Live fetch failed; showing last known timings.",
      });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch prayer times" },
      { status: 502 }
    );
  }

  const fajr: string = aladhanJson.data.timings.Fajr;
  const maghrib: string = aladhanJson.data.timings.Maghrib;

  await supabase.from("aladhan_prayer_time_cache").upsert(
    {
      tenant_id: tenantId,
      date,
      fajr,
      maghrib,
      raw_response: aladhanJson,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,date" }
  );

  return NextResponse.json({ date, fajr, maghrib, source: "aladhan_live" });
}
