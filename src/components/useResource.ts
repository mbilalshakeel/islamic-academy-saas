"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Thin client-side hook wrapping the generic /api/tenant-admin/resource/[table]
 * CRUD endpoint. Every Stage-1 content screen uses this instead of hand-rolling
 * fetch calls, so loading/error/optimistic-refresh behavior is consistent.
 */
export function useResource<T extends { id: string }>(table: string, parentId?: string | null, parentColumn?: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const qs = parentColumn && parentId ? `?${parentColumn}=${parentId}` : "";
    const res = await fetch(`/api/tenant-admin/resource/${table}${qs}`);
    const body = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(body.error);
      return;
    }
    setItems(body.items);
  }, [table, parentId, parentColumn]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(fields: Partial<T>) {
    const res = await fetch(`/api/tenant-admin/resource/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    await load();
    return body.item as T;
  }

  async function update(id: string, fields: Partial<T>) {
    const res = await fetch(`/api/tenant-admin/resource/${table}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fields),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    await load();
    return body.item as T;
  }

  async function remove(id: string) {
    const res = await fetch(`/api/tenant-admin/resource/${table}/${id}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    await load();
  }

  async function reorder(order: Array<{ id: string; sort_order: number }>) {
    // Optimistic local reorder for instant UI feedback.
    setItems((prev) => {
      const byId = new Map(order.map((o) => [o.id, o.sort_order]));
      return [...prev].sort((a, b) => (byId.get(a.id) ?? 0) - (byId.get(b.id) ?? 0));
    });
    const res = await fetch(`/api/tenant-admin/resource/${table}/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error);
    await load();
  }

  return { items, loading, error, load, create, update, remove, reorder };
}
