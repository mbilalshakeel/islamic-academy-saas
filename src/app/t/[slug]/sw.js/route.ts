import { NextResponse } from "next/server";
import { getPublicTenantContext } from "@/lib/public-tenant";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { tenant, branding } = await getPublicTenantContext(params.slug);

    if (!tenant) {
      return new NextResponse("// Tenant not found", {
        status: 404,
        headers: { "Content-Type": "application/javascript; charset=utf-8" },
      });
    }

    const swVersion = branding?.sw_cache_version || "1";
    const tenantSlug = tenant.slug;

    const js = `// Tenant-Scoped Service Worker for ${tenant.name} (${tenantSlug})
// Generated: ${new Date().toISOString()}
const TENANT_SLUG = ${JSON.stringify(tenantSlug)};
const CACHE_VERSION = ${JSON.stringify(swVersion)};
const CACHE_NAME = "ici-" + TENANT_SLUG + "-v" + CACHE_VERSION;
const SCOPE_PATH = "/t/" + TENANT_SLUG;

const APP_SHELL = [
  SCOPE_PATH,
  SCOPE_PATH + "/",
  SCOPE_PATH + "/quran/16-line",
  SCOPE_PATH + "/quran/15-line",
  SCOPE_PATH + "/qaida",
  SCOPE_PATH + "/names/allah",
  SCOPE_PATH + "/names/prophet",
  SCOPE_PATH + "/duas",
  SCOPE_PATH + "/duas/masnoon",
  SCOPE_PATH + "/hadith",
  SCOPE_PATH + "/pillars",
  SCOPE_PATH + "/prayers",
  SCOPE_PATH + "/books",
  SCOPE_PATH + "/qa",
  SCOPE_PATH + "/about",
  SCOPE_PATH + "/contact",
  SCOPE_PATH + "/tools/sehri-iftar",
  SCOPE_PATH + "/tools/dhikr",
  SCOPE_PATH + "/tools/calendar",
  SCOPE_PATH + "/tools/zakat",
  SCOPE_PATH + "/manifest.json"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  // Cache core app shell routes in background without blocking SW activation
  caches.open(CACHE_NAME).then((cache) => {
    cache.addAll([
      SCOPE_PATH,
      SCOPE_PATH + "/manifest.json"
    ]).catch((err) => {
      console.warn("[SW] Some app shell routes failed to precache:", err);
    });
  });
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          // Delete old caches belonging to THIS tenant only
          if (name.startsWith("ici-" + TENANT_SLUG + "-") && name !== CACHE_NAME) {
            return caches.delete(name);
          }
          return Promise.resolve();
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept admin panels, login, or API routes
  if (
    url.pathname.includes("/admin") ||
    url.pathname.includes("/login") ||
    url.pathname.includes("/api/") ||
    url.pathname.startsWith("/platform-admin")
  ) {
    return;
  }

  // Handle same-origin requests under this tenant's scope
  if (url.origin === self.location.origin && url.pathname.startsWith(SCOPE_PATH)) {
    // NETWORK-FIRST strategy for navigation and HTML content routes
    // This ensures admin edits are reflected immediately on next load without stale cache issues
    if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
      event.respondWith(
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, resClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            return caches.match(request).then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              // Offline fallback to tenant root if specific page not cached
              return caches.match(SCOPE_PATH);
            });
          })
      );
      return;
    }

    // STALE-WHILE-REVALIDATE for static assets / Next.js bundles / images
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const resClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, resClone);
              });
            }
            return networkResponse;
          })
          .catch((err) => {
            // Offline and network failed
          });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
`;

    return new NextResponse(js, {
      headers: {
        "Content-Type": "application/javascript; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Service-Worker-Allowed": `/t/${tenantSlug}`,
      },
    });
  } catch (err) {
    console.error("[sw.js] Error generating service worker:", err);
    return new NextResponse("// Error generating service worker", {
      status: 500,
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  }
}
