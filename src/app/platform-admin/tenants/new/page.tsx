"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Select } from "@/components/ui";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewTenantPage() {
  const [instituteName, setInstituteName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [plan, setPlan] = useState("trial");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any>(null);
  const router = useRouter();

  // Auto-suggest slug from name, unless the user has manually edited it.
  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(instituteName));
    }
  }, [instituteName, slugTouched]);

  // Live uniqueness check, debounced.
  useEffect(() => {
    if (!slug) {
      setSlugAvailable(null);
      return;
    }
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/platform-admin/tenants/check-slug?slug=${encodeURIComponent(slug)}`);
      const body = await res.json();
      setSlugAvailable(res.ok ? body.available : null);
    }, 300);
    return () => clearTimeout(handle);
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/platform-admin/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        institute_name: instituteName,
        slug,
        admin_email: adminEmail,
        plan,
      }),
    });
    const body = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(body.error);
      return;
    }

    setSuccess(body);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-0)", padding: "var(--sp-8)" }}>
        <div className="max-w-lg w-full space-y-4" style={{ background: "var(--surface-1)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)", padding: "var(--sp-8)" }}>
          <h1 className="ds-h2" style={{ color: "var(--success)" }}>
            ✅ Tenant created &amp; fully seeded
          </h1>
          <dl className="space-y-1" style={{ fontSize: "var(--fs-body)" }}>
            <div>
              <dt className="inline font-semibold">Tenant ID: </dt>
              <dd className="inline" style={{ fontFamily: "ui-monospace, monospace" }}>{success.tenant.id}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Slug: </dt>
              <dd className="inline" style={{ fontFamily: "ui-monospace, monospace" }}>{success.tenant.slug}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Name: </dt>
              <dd className="inline">{success.tenant.name}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Admin email: </dt>
              <dd className="inline">{success.admin_email}</dd>
            </div>
            <div>
              <dt className="inline font-semibold">Invite sent: </dt>
              <dd className="inline">{success.invite_sent ? "Yes" : "No"}</dd>
            </div>
          </dl>
          <p style={{ fontSize: "var(--fs-body)", color: "var(--text-secondary)" }}>
            The admin will receive a magic-link invite email to set their password and log in at <code>/t/{success.tenant.slug}/admin</code>.
          </p>
          <Button onClick={() => router.push("/platform-admin/dashboard")} style={{ width: "100%" }}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--surface-0)", padding: "var(--sp-8)" }}>
      <form onSubmit={handleSubmit} className="max-w-lg w-full space-y-4" style={{ background: "var(--surface-1)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-lg)", padding: "var(--sp-8)" }}>
        <h1 className="ds-h1">Create New Tenant</h1>

        <Field label="Institute Name">
          <Input required value={instituteName} onChange={(e) => setInstituteName(e.target.value)} placeholder="e.g. Masjid An-Noor" />
        </Field>

        <Field
          label="Slug (URL identifier)"
          helper={slug && slugAvailable === true ? "Available." : undefined}
          error={slug && slugAvailable === false ? "This slug is already taken." : undefined}
        >
          <Input
            required
            style={{ fontFamily: "ui-monospace, monospace" }}
            value={slug}
            onChange={(e) => {
              setSlug(slugify(e.target.value));
              setSlugTouched(true);
            }}
            placeholder="masjid-an-noor"
          />
        </Field>

        <Field label="Admin Email" helper="This person will receive a magic-link invite email and become the tenant's first owner-role admin.">
          <Input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@institute.com" />
        </Field>

        <Field label="Initial Plan">
          <Select value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="trial">Trial</option>
            <option value="basic">Basic</option>
            <option value="pro">Pro</option>
          </Select>
        </Field>

        {error && <p style={{ color: "var(--danger)", fontSize: "var(--fs-body)" }}>{error}</p>}

        <Button type="submit" disabled={loading || slugAvailable === false} style={{ width: "100%" }}>
          {loading ? "Creating & seeding tenant..." : "Create Tenant"}
        </Button>
      </form>
    </div>
  );
}
