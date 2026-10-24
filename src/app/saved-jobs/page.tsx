"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { JobCard, type Job } from "@/components/jobs/JobCard";
import { EmptyState, Skeleton } from "@/components/ui";

const JOB_COLS = "id,title,company,location,country_code,city,workplace_type,employment_type,seniority,industry,salary_min,salary_max,salary_currency,salary_period,apply_url,posted_at,created_at";

export default function SavedJobsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!), []);
  const [userId, setUserId] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.replace("/login?next=/saved-jobs");
      setUserId(user.id);
      const { data, error } = await supabase.from("saved_jobs").select(`created_at, jobs(${JOB_COLS})`).eq("user_id", user.id).order("created_at", { ascending: false });
      if (error) setMessage("Unable to load saved jobs.");
      const list = (data ?? []).map((r: { jobs: unknown }) => (Array.isArray(r.jobs) ? r.jobs[0] : r.jobs)).filter(Boolean) as Job[];
      setJobs(list);
      setLoading(false);
    })();
  }, [supabase, router]);

  async function unsave(jobId: string) {
    setBusyId(jobId);
    const { error } = await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId);
    if (error) setMessage("Unable to remove job.");
    else setJobs((c) => c.filter((j) => j.id !== jobId));
    setBusyId(null);
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section className="tc-hero">
        <h1>Saved jobs</h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>Roles you bookmarked, ready when you are.</p>
      </section>
      {message && <p role="status" className="tc-badge tc-tone-peach">{message}</p>}
      {loading ? <div className="tc-card"><Skeleton /></div>
        : jobs.length === 0 ? <EmptyState title="Nothing saved yet" body="Save jobs from search to compare them here." action={<Link href="/jobs" className="tc-btn tc-btn-primary">Search jobs</Link>} />
        : jobs.map((j) => <JobCard key={j.id} job={j} saved busy={busyId === j.id} onSave={() => unsave(j.id)} onDraft={() => router.push(`/jobs?q=${encodeURIComponent(j.title)}`)} />)}
    </div>
  );
}
