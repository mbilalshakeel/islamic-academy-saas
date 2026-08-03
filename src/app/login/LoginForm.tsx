"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export default function LoginForm() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // Decode the tenant_id claim client-side just to route the user to
    // their own tenant's admin area automatically after login.
    const token = data.session?.access_token;
    let tenantId: string | undefined;
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        tenantId = payload.tenant_id;
      } catch {}
    }

    const next = searchParams.get("next");
    router.push(next || (tenantId ? `/admin` : "/"));
    router.refresh();
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    setLoading(false);
    if (otpError) {
      setError(otpError.message);
    } else {
      setError("Magic link sent — check your inbox (or Inbucket in local dev).");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: "var(--surface-0)", padding: "var(--sp-4)" }}>
      <div className="w-full max-w-sm relative" style={{ background: "var(--surface-1)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--border-subtle)", padding: "var(--sp-7)" }}>
        <div style={{ marginBottom: "var(--sp-5)" }}>
          <div className="ds-micro" style={{ marginBottom: 4 }}>
            INSTITUTE ADMIN
          </div>
          <h1 className="ds-h1">Sign in</h1>
        </div>

        <form onSubmit={handlePasswordLogin} className="space-y-3">
          <Input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" required placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in..." : "Sign in with password"}
          </Button>
        </form>

        <Button variant="secondary" onClick={handleMagicLink} disabled={loading || !email} style={{ width: "100%", marginTop: "var(--sp-3)" }}>
          Send magic link instead
        </Button>

        {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)", marginTop: "var(--sp-3)" }}>{error}</p>}
      </div>
    </div>
  );
}
