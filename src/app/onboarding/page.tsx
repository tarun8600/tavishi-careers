"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNextPath } from "@/lib/auth/redirect";
import { WORKPLACE_TYPES } from "@/lib/profile/validate";

function OnboardingForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const [form, setForm] = useState({ full_name: "", headline: "", skills: "", country_code: "", city: "", preferred_workplace: "any" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then(async (r) => {
      if (r.status === 401) return router.replace("/login?next=/onboarding");
      const { profile } = await r.json();
      if (profile) {
        setForm({
          full_name: profile.full_name ?? "",
          headline: profile.headline ?? "",
          skills: (profile.skills ?? []).join(", "),
          country_code: profile.country_code ?? "",
          city: profile.city ?? "",
          preferred_workplace: profile.preferred_workplace ?? "any",
        });
      }
    }).catch(() => setMessage("Unable to load your profile."));
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setErrors({}); setMessage("");
    const r = await fetch("/api/profile", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    if (r.ok) return router.replace(next);
    const body = await r.json().catch(() => ({}));
    if (body.fields) setErrors(body.fields);
    setMessage(body.error ?? "Unable to save profile.");
  }

  const field = (name: keyof typeof form, label: string, placeholder = "") => (
    <label style={{ display: "block", marginBottom: 12 }}>
      {label}
      <input name={name} value={form[name]} placeholder={placeholder} onChange={(e) => setForm({ ...form, [name]: e.target.value })} style={{ display: "block", width: "100%", padding: 8 }} />
      {errors[name] && <small role="alert" style={{ color: "#b42318" }}>{errors[name]}</small>}
    </label>
  );

  return (
    <form onSubmit={submit} style={{ maxWidth: 520 }}>
      <h1>Welcome to Tavishi Careers</h1>
      <p>Tell us a little about yourself so we can tailor job search to you.</p>
      {field("full_name", "Full name *")}
      {field("headline", "Headline", "e.g. Senior Data Engineer")}
      {field("skills", "Skills (comma separated)", "TypeScript, SQL, Leadership")}
      {field("country_code", "Country (ISO code)", "IN, US, GB…")}
      {field("city", "City")}
      <label style={{ display: "block", marginBottom: 12 }}>
        Preferred workplace
        <select value={form.preferred_workplace} onChange={(e) => setForm({ ...form, preferred_workplace: e.target.value })} style={{ display: "block", padding: 8 }}>
          {WORKPLACE_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </label>
      <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save and continue"}</button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}

export default function OnboardingPage() {
  return <Suspense fallback={<p>Loading…</p>}><OnboardingForm /></Suspense>;
}
