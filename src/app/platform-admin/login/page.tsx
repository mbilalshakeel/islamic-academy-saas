"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";

export default function PlatformAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/platform-admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error || "Login failed");
      return;
    }

    router.push("/platform-admin/dashboard");
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #10151C 0%, #1C2733 55%, #0B0F14 100%)", padding: "var(--sp-4)" }}
    >
      <div className="ds-motif-bg" style={{ opacity: 0.08 }} />
      <div className="w-full max-w-sm relative" style={{ background: "var(--surface-1)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)", padding: "var(--sp-7)" }}>
        <div style={{ marginBottom: "var(--sp-5)" }}>
          <div className="ds-micro" style={{ color: "#0369A1", marginBottom: 4 }}>
            ICI PLATFORM
          </div>
          <h1 className="ds-h1">Platform Admin</h1>
          <p className="ds-caption">Internal staff access only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)", marginTop: "var(--sp-3)" }}>{error}</p>}
      </div>
    </div>
  );
}
