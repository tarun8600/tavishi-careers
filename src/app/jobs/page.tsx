"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { filtersToQuery, parseJobFilters, PAGE_SIZE, type JobFilters } from "@/lib/jobs/filters";
import { countryName, WORLDWIDE } from "@/lib/design/countries";
import { SearchFilters } from "@/components/jobs/SearchFilters";
import { JobCard, type Job } from "@/components/jobs/JobCard";
import { EmptyState, Skeleton } from "@/components/ui";

type Resume = { id: string; filename: string };

function JobsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [filters, setFilters] = useState<JobFilters>(() => parseJobFilters(params));
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [resumeId, setResumeId] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    return url && key ? createBrowserClient(url, key) : null;
  }, []);

  // Load the signed-in user's saved jobs and resumes (RLS restricts to own rows).
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const [saved, res] = await Promise.all([
        supabase.from("saved_jobs").select("job_id").eq("user_id", user.id),
        supabase.from("resumes").select("id,filename").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setSavedIds((saved.data ?? []).map((r: { job_id: string }) => r.job_id));
      setResumes(res.data ?? []);
      if (res.data?.[0]) setResumeId(res.data[0].id);
    })();
  }, [supabase]);

  // Fetch real jobs from the API whenever filters change (debounced); keep URL shareable.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const qs = filtersToQuery(filters);
      router.replace(qs ? `/jobs?${qs}` : "/jobs", { scroll: false });
      setLoading(true);
      try {
        const r = await fetch(`/api/jobs?${qs}`);
        const body = await r.json();
        if (!r.ok) throw new Error(body.error);
        setJobs(body.jobs); setTotal(body.total); setMessage("");
      } catch {
        setJobs([]); setTotal(0); setMessage("Jobs could not be loaded right now. Please try again.");
      } finally {
        setLoading(false);
      }
    }, 250);
  }, [filters, router]);

  async function toggleSave(jobId: string) {
    if (!userId || !supabase) return router.push("/login?next=/jobs");
    setBusyId(jobId);
    const saved = savedIds.includes(jobId);
    const { error } = saved
      ? await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId)
      : await supabase.from("saved_jobs").insert({ user_id: userId, job_id: jobId });
    if (error) setMessage("Unable to update saved jobs.");
    else setSavedIds((c) => (saved ? c.filter((id) => id !== jobId) : [...c, jobId]));
    setBusyId(null);
  }

  async function createDraft(jobId: string) {
    if (!userId) return router.push("/login?next=/jobs");
    if (!resumeId) return setMessage("Upload and select a resume first.");
    setBusyId(jobId);
    try {
      const r = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body: JSON.stringify({ jobId, resumeId }) });
      const body = await r.json();
      if (!r.ok) return setMessage(body.error ?? "Unable to create application draft.");
      router.push("/applications");
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setBusyId(null);
    }
  }

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const where = filters.country === WORLDWIDE ? "worldwide" : `in ${countryName(filters.country)}`;

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section className="tc-hero">
        <h1>Explore opportunities {where}</h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>Real openings from employer sources. Filter by location, workplace, salary, seniority and employment type.</p>
      </section>

      <SearchFilters value={filters} onChange={setFilters} />

      {userId && (
        <label className="tc-field" style={{ maxWidth: 360, margin: 0 }}>
          <span>Resume for drafts</span>
          <select value={resumeId} onChange={(e) => setResumeId(e.target.value)}>
            {resumes.length === 0 && <option value="">No resumes uploaded</option>}
            {resumes.map((r) => <option key={r.id} value={r.id}>{r.filename}</option>)}
          </select>
        </label>
      )}

      <section aria-live="polite" style={{ display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Results</h2>
          {!loading && <span className="tc-hint">{total.toLocaleString("en")} job{total === 1 ? "" : "s"}</span>}
        </div>
        {message && <p role="status" className="tc-badge tc-tone-peach">{message}</p>}
        {loading ? <div className="tc-card"><Skeleton lines={4} /></div>
          : jobs.length === 0 ? (
            <EmptyState title="No matching jobs yet"
              body={filters.country === WORLDWIDE ? "No active jobs match these filters. Try removing a filter." : `No active jobs match in ${countryName(filters.country)}. Try Worldwide or remove a filter.`}
              action={filters.country !== WORLDWIDE ? <button type="button" className="tc-btn tc-btn-secondary" onClick={() => setFilters({ ...filters, country: WORLDWIDE, page: 1 })}>Search worldwide</button> : undefined} />
          ) : jobs.map((job) => (
            <JobCard key={job.id} job={job} saved={savedIds.includes(job.id)} busy={busyId === job.id}
              onSave={() => toggleSave(job.id)} onDraft={() => createDraft(job.id)} />
          ))}
        {pages > 1 && (
          <nav aria-label="Pagination" style={{ display: "flex", gap: 12, justifyContent: "center", alignItems: "center" }}>
            <button type="button" className="tc-btn tc-btn-secondary" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
            <span className="tc-hint">Page {filters.page} of {pages}</span>
            <button type="button" className="tc-btn tc-btn-secondary" disabled={filters.page >= pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
          </nav>
        )}
      </section>
    </div>
  );
}

export default function JobsPage() {
  return <Suspense fallback={<Skeleton lines={4} />}><JobsInner /></Suspense>;
}
