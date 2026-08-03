"use client";

import { useEffect } from "react";

export function PwaRegistrar({ slug }: { slug: string }) {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const swUrl = `/t/${slug}/sw.js`;
      const swScope = `/t/${slug}`;

      navigator.serviceWorker
        .register(swUrl, { scope: swScope })
        .catch((err) => {
          console.error(`[PWA] Failed to register service worker for tenant ${slug}:`, err);
        });
    }
  }, [slug]);

  return null;
}
