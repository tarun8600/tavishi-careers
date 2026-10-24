"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { summarize } from "@/lib/applications/tracking";
import { EmptyState, Skeleton, StatusBadge } from "@/components/ui";

type App = { id: string; status: string; follow_up_at: string | null; created_at: string; jobs: { title: string; company: string } | null };

export default function DashboardPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!), []);
  const [name, setName] = useState("");
  const [apps, setApps] = useState<App[]>([]);
  const [counts, setCounts] = useState({ resumes: 0, saved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/login?next=/dashboard");
      const [profile, a, r, s] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("applications").select("id,status,follow_up_at,created_at,jobs(title,company)").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("resumes").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("saved_jobs").select("job_id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      if (a.error) setError("Some data could not be loaded.");
      setName(profile.data?.full_name ?? user.email ?? "");
      setApps(((a.data ?? []) as unknown as (App & { jobs: App["jobs"] | App["jobs"][] })[]).map((x) => ({ ...x, jobs: Array.isArray(x.jobs) ? x.jobs[0] ?? null : x.jobs })));
      setCounts({ resumes: r.count ?? 0, saved: s.count ?? 0 });
      setLoading(false);
    })();
  }, [supabase, router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) return <div className="tc-card"><Skeleton lines={5} /></div>;
  const sum = summarize(apps);
  const stats: [string, number, string, string][] = [
    ["Resumes", counts.resumes, "mint", "/resumes"], ["Saved jobs", counts.saved, "sky", "/saved-jobs"],
    ["Preparing", sum.preparing, "lavender", "/applications"], ["Approved", sum.approved, "mint", "/applications"],
    ["Sent", sum.sent, "sky", "/applications"], ["Interviews", sum.interviews, "peach", "/applications"],
  ];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section className="tc-hero" style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Welcome back{name ? `, ${name}` : ""}</h1>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>Here is where your search stands today.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Link href="/jobs" className="tc-btn tc-btn-primary">Find jobs</Link>
          <button type="button" className="tc-btn tc-btn-secondary" onClick={signOut}>Sign out</button>
        </div>
      </section>
      {error && <p role="status" className="tc-badge tc-tone-peach">{error}</p>}
      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {stats.map(([label, n, tone, href]) => (
          <Link key={label} href={href} className="tc-card tc-card-hover" style={{ textDecoration: "none", color: "inherit" }}>
            <span className={`tc-badge tc-tone-${tone}`}>{label}</span>
            <p style={{ fontSize: "2rem", fontFamily: "var(--font-display)", margin: "8px 0 0" }}>{n}</p>
          </Link>
        ))}
      </section>
      {sum.followUpsDue > 0 && <p className="tc-badge tc-tone-yellow">{sum.followUpsDue} follow-up reminder{sum.followUpsDue === 1 ? "" : "s"} due</p>}
      <section className="tc-card">
        <h2>Recent activity</h2>
        {apps.length === 0 ? (
          <EmptyState title="No applications yet" body="Prepare a draft from any job. Nothing is sent without your approval." action={<Link href="/jobs" className="tc-btn tc-btn-primary">Browse jobs</Link>} />
        ) : (
          <table>
            <thead><tr><th>Role</th><th>Company</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {apps.slice(0, 8).map((a) => (
                <tr key={a.id}><td>{a.jobs?.title ?? "—"}</td><td>{a.jobs?.company ?? "—"}</td><td><StatusBadge status={a.status} /></td><td>{new Date(a.created_at).toLocaleDateString("en", { dateStyle: "medium" })}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="tc-card">
        <h2>Recommended for you</h2>
        <p className="tc-hint" style={{ margin: 0 }}>Personalized recommendations will appear once resume analysis is available. We never show match scores without real analysis.</p>
      </section>
    </div>
  );
}
