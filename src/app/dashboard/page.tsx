"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  description: string | null;
  apply_url: string | null;
  created_at: string;
};

type ApplicationRow = {
  id: string;
  status: string;
  created_at: string;
  jobs: { title: string; company: string; location: string | null } | null;
};

const colors = ["mint", "sky", "rose", "cream", "lilac"];
const tabs = ["all", "draft", "approved", "withdrawn", "submitted", "interview", "offer", "rejected"];

function workplaceOf(location: string | null): string {
  const text = (location ?? "").toLowerCase();
  if (/\bremote\b/.test(text)) return "remote";
  if (/\bhybrid\b/.test(text)) return "hybrid";
  // An absent remote/hybrid label doesn't prove a listing is onsite.
  return "unspecified";
}

function snippet(description: string | null) {
  return (description ?? "View the complete position on the employer website.")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

function friendlyDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DashboardPage() {
  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      ),
    []
  );

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [workplace, setWorkplace] = useState("all");
  const [company, setCompany] = useState("all");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("all");
  const [busyJob, setBusyJob] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (!active) return;
      if (authError || !auth.user) {
        window.location.replace("/login");
        return;
      }

      const user = auth.user;
      setUserId(user.id);

      const [jobResult, applicationResult, savedResult] = await Promise.all([
        supabase
          .from("jobs")
          .select("id,title,company,location,description,apply_url,created_at")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(200),
        supabase
          .from("applications")
          .select("id,status,created_at,jobs(title,company,location)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("saved_jobs").select("job_id").eq("user_id", user.id),
      ]);

      if (!active) return;
      const issues = [jobResult.error, applicationResult.error, savedResult.error]
        .filter(Boolean)
        .map((item) => item!.message);
      if (issues.length) setError(issues.join(" | "));

      setJobs((jobResult.data ?? []) as Job[]);
      setSavedIds((savedResult.data ?? []).map((record) => record.job_id));
      const normalized = (applicationResult.data ?? []).map((item) => ({
        ...item,
        jobs: Array.isArray(item.jobs) ? item.jobs[0] ?? null : item.jobs,
      }));
      setApplications(normalized as ApplicationRow[]);
      setLoading(false);
    }

    void load();
    return () => { active = false; };
  }, [supabase]);

  const companies = useMemo(
    () => [...new Set(jobs.map((item) => item.company))].sort(),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const q = query.toLowerCase().trim();
    const l = location.toLowerCase().trim();
    const result = jobs.filter((job) => {
      const searchable = `${job.title} ${job.company} ${job.description ?? ""}`.toLowerCase();
      return (
        (!q || searchable.includes(q)) &&
        (!l || (job.location ?? "").toLowerCase().includes(l)) &&
        (company === "all" || job.company === company) &&
        (workplace === "all" || workplaceOf(job.location) === workplace)
      );
    });
    if (sort === "oldest") result.reverse();
    return result;
  }, [jobs, query, location, workplace, company, sort]);

  const displayedApplications = applications.filter(
    (item) => status === "all" || item.status === status
  );

  async function toggleSaved(jobId: string) {
    if (!userId || busyJob) return;
    setBusyJob(jobId);
    setError("");
    const isSaved = savedIds.includes(jobId);
    const result = isSaved
      ? await supabase.from("saved_jobs").delete().eq("user_id", userId).eq("job_id", jobId)
      : await supabase.from("saved_jobs").insert({ user_id: userId, job_id: jobId });

    if (result.error) setError(result.error.message);
    else setSavedIds((current) =>
      isSaved ? current.filter((id) => id !== jobId) : [...current, jobId]
    );
    setBusyJob(null);
  }

  return (
    <main className="tc-shell">
      <header className="tc-header">
        <Link href="/dashboard" className="tc-brand"><span className="tc-logo">✦</span> Tavishi Careers</Link>
        <nav aria-label="Main navigation" className="tc-nav">
          <Link className="tc-active" href="/dashboard">Dashboard</Link>
          <Link href="/jobs">Browse Jobs</Link>
          <Link href="/applications">Tracker</Link>
          <Link href="/saved-jobs">Saved Jobs</Link>
          <Link href="/resumes">Resumes</Link>
          <Link href="/profile">Profile</Link>
        </nav>
        <span className="tc-country">🇺🇸 USA Jobs</span>
      </header>

      <div className="tc-container">
        <section className="tc-filters" aria-label="Search jobs">
          <div className="tc-search-row">
            <label className="tc-search"><span aria-hidden="true">⌕</span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, keyword, or company..." aria-label="Job title, keyword, or company" />
            </label>
            <label className="tc-location"><span aria-hidden="true">⌖</span>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, state, or Remote" aria-label="Location" />
            </label>
            <Link className="tc-primary tc-search-button" href="/jobs">Browse all jobs →</Link>
          </div>
          <div className="tc-filter-row">
            <label className="tc-chip">Workplace
              <select value={workplace} onChange={(e) => setWorkplace(e.target.value)} aria-label="Work arrangement">
                <option value="all">All</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="unspecified">Not specified</option>
              </select>
            </label>
            <label className="tc-chip">Company
              <select value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Company">
                <option value="all">All</option>
                {companies.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label className="tc-chip">Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort jobs">
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </label>
            <button className="tc-clear" type="button" onClick={() => {
              setQuery(""); setLocation(""); setWorkplace("all"); setCompany("all"); setSort("newest");
            }}>✕ Clear filters</button>
          </div>
          <p className="tc-filter-note">Searches currently loaded listings. Onsite roles are included; an unspecified work arrangement is not assumed to be onsite.</p>
        </section>

        {error && <p className="tc-error" role="alert">{error}</p>}

        <section className="tc-section" aria-labelledby="top-jobs-title">
          <div className="tc-heading-row">
            <div><h1 id="top-jobs-title">Explore USA job opportunities</h1>
              <p>{loading ? "Loading opportunities..." : `${filteredJobs.length} matching listings from your connected sources`}</p>
            </div>
            <div className="tc-actions"><Link className="tc-outline" href="/saved-jobs">☆ Saved jobs ({savedIds.length})</Link><Link className="tc-primary" href="/jobs">Browse jobs →</Link></div>
          </div>

          {loading ? <div className="tc-empty">Loading jobs...</div> : filteredJobs.length === 0 ?
            <div className="tc-empty">No jobs match these filters. Try a different title or location.</div> :
            <div className="tc-job-grid">
              {filteredJobs.slice(0, 10).map((job, index) => (
                <article key={job.id} className={`tc-job-card ${colors[index % colors.length]}`}>
                  <div className="tc-card-top"><div className="tc-company-mark">{job.company.charAt(0).toUpperCase()}</div><span className="tc-source">{job.company}</span></div>
                  <span className="tc-workplace">{workplaceOf(job.location) === "unspecified" ? "Workplace not specified" : workplaceOf(job.location)}</span>
                  <h2>{job.title}</h2>
                  <div className="tc-job-location">⌖ {job.location || "Location not specified"}</div>
                  <p className="tc-description">{snippet(job.description)}</p>
                  <div className="tc-card-bottom"><span className="tc-date">{friendlyDate(job.created_at)}</span>
                    <button type="button" onClick={() => void toggleSaved(job.id)} disabled={busyJob !== null} className="tc-save" aria-label={savedIds.includes(job.id) ? `Unsave ${job.title}` : `Save ${job.title}`}>{savedIds.includes(job.id) ? "★" : "☆"}</button>
                    {job.apply_url ? <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="tc-apply">Employer site ↗</a> : <Link href="/jobs" className="tc-apply">View job →</Link>}
                  </div>
                </article>
              ))}
            </div>
          }
          {!loading && filteredJobs.length > 10 && <p className="tc-hint">Showing the first 10 matching jobs. Browse Jobs has the full list.</p>}
          <p className="tc-hint">Jobs are displayed from connected sources. Employer links open externally; no application is submitted automatically.</p>
        </section>

        <section className="tc-pipeline" aria-labelledby="pipeline-title">
          <div className="tc-heading-row">
            <div><h2 id="pipeline-title">Application pipeline</h2><p>Track your applications and approval status in one place.</p></div>
            <Link href="/applications" className="tc-outline">Open tracker ↗</Link>
          </div>
          <div className="tc-tabs" role="group" aria-label="Filter applications by status">
            {tabs.map((item) => {
              const count = item === "all" ? applications.length : applications.filter((app) => app.status === item).length;
              return <button key={item} type="button" className={status === item ? "tc-tab tc-tab-active" : "tc-tab"} onClick={() => setStatus(item)}>{item === "all" ? "All" : item.replaceAll("_", " ")} ({count})</button>;
            })}
          </div>
          <div className="tc-table-wrap">
            <table><thead><tr><th>Job title</th><th>Company</th><th>Location</th><th>Status</th><th>Created</th><th>Action</th></tr></thead>
              <tbody>{displayedApplications.length === 0 ?
                <tr><td colSpan={6} className="tc-no-apps">No applications in this category.</td></tr> :
                displayedApplications.slice(0, 8).map((item) => <tr key={item.id}>
                  <td>{item.jobs?.title ?? "Unavailable job"}</td><td>{item.jobs?.company ?? "—"}</td><td>{item.jobs?.location ?? "—"}</td>
                  <td><span className={`tc-status ${item.status === "approved" ? "approved" : ""}`}>{item.status.replaceAll("_", " ")}</span></td>
                  <td>{friendlyDate(item.created_at)}</td><td><Link href="/applications">Review →</Link></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="tc-bottom"><Link href="/resumes">Manage resumes ↗</Link><Link href="/applications">Manage application drafts ↗</Link></div>
        </section>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f7f9fb; color: #152339; font-family: Arial, Helvetica, sans-serif; }
        .tc-shell a { text-decoration: none; color: inherit; }
        .tc-header { min-height: 76px; background: white; border-bottom: 1px solid #e4e9ee; padding: 14px 28px; display: flex; align-items: center; flex-wrap: wrap; gap: 24px; }
        .tc-brand { white-space: nowrap; font-size: 23px; font-weight: 800; }
        .tc-logo { color: #0a6951; font-size: 28px; }
        .tc-nav { display: flex; gap: 7px; flex: 1; align-items: center; flex-wrap: wrap; }
        .tc-nav a { padding: 11px 12px; font-size: 13px; font-weight: 600; border-radius: 12px; }
        .tc-nav a:hover, .tc-active { background: #eaf5ef; color: #06533f !important; }
        .tc-country { white-space: nowrap; color: #0a614c; background: #e6f5ee; border-radius: 999px; padding: 10px 13px; font-weight: 700; font-size: 12px; }
        .tc-container { padding: 22px 28px 60px; margin: auto; max-width: 1700px; }
        .tc-filters, .tc-pipeline { background: #fff; border: 1px solid #e6eaef; border-radius: 20px; box-shadow: 0 4px 30px rgba(16, 35, 63, 0.035); padding: 20px; }
        .tc-search-row { display: flex; gap: 12px; flex-wrap: wrap; }
        .tc-search, .tc-location { border: 1px solid #dce4eb; border-radius: 14px; padding: 0 15px; min-height: 55px; display: flex; align-items: center; gap: 10px; background: #fff; }
        .tc-search { flex: 3 1 300px; }.tc-location { flex: 1 1 220px; }
        .tc-search span, .tc-location span { font-size: 24px; color: #687d8c; }
        .tc-search input, .tc-location input { border: 0; background: transparent; outline: none; width: 100%; font-size: 14px; color: #14263b; }
        .tc-primary { background: #064b3a; color: #fff !important; display: inline-flex; align-items: center; justify-content: center; padding: 13px 20px; font-weight: 700; border-radius: 14px; border: 0; font-size: 13px; }
        .tc-primary:hover, .tc-apply:hover { background: #087459; }
        .tc-search-button { min-height: 55px; }
        .tc-filter-row { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 15px; align-items: center; }
        .tc-chip { display: flex; gap: 8px; align-items: center; border: 1px solid #dce5ec; padding: 9px 13px; border-radius: 999px; font-size: 13px; font-weight: 600; }
        .tc-chip select { max-width: 170px; border: 0; background: transparent; outline: 0; color: #0b5946; font-size: 13px; }
        .tc-clear { background: none; border: 0; color: #53677a; cursor: pointer; margin-left: auto; }
        .tc-filter-note, .tc-hint { font-size: 12px; color: #6b7887; margin-top: 12px; }
        .tc-error { background: #fff3f0; border: 1px solid #f5c7bb; border-radius: 12px; padding: 12px; color: #a12b12; }
        .tc-section { margin-top: 26px; }.tc-heading-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
        .tc-heading-row h1, .tc-heading-row h2 { font-size: 23px; margin: 0 0 7px; }
        .tc-heading-row p { font-size: 13px; margin: 0; color: #738295; }
        .tc-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .tc-outline { display: inline-flex; align-items: center; padding: 12px 17px; border-radius: 14px; background: #fff; border: 1px solid #dce4eb; font-weight: 700; font-size: 13px; }
        .tc-outline:hover { border-color: #0c775c; }
        .tc-job-grid { display: grid; grid-template-columns: repeat(5, minmax(215px, 1fr)); gap: 14px; }
        .tc-job-card { min-height: 325px; border-radius: 19px; padding: 20px; display: flex; flex-direction: column; border: 1px solid rgba(31, 58, 79, 0.06); }
        .tc-job-card.mint { background: #effaf4; }.tc-job-card.sky { background: #edf7ff; }.tc-job-card.rose { background: #fff0f2; }.tc-job-card.cream { background: #fffaf0; }.tc-job-card.lilac { background: #f4f0ff; }
        .tc-card-top { display: flex; gap: 11px; align-items: center; }
        .tc-company-mark { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 12px; background: white; color: #0b624a; font-size: 19px; font-weight: 800; flex-shrink: 0; }
        .tc-source { font-size: 13px; font-weight: 700; overflow-wrap: anywhere; }
        .tc-workplace { align-self: flex-start; font-size: 11px; background: rgba(255,255,255,.75); padding: 6px 9px; border-radius: 999px; margin-top: 12px; text-transform: capitalize; }
        .tc-job-card h2 { font-size: 19px; line-height: 1.3; margin: 14px 0 11px; }
        .tc-job-location { font-size: 12px; color: #53667b; margin-bottom: 12px; }
        .tc-description { color: #52657a; font-size: 12px; line-height: 1.5; margin: 0 0 18px; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 4; }
        .tc-card-bottom { display: flex; align-items: center; gap: 7px; margin-top: auto; }.tc-date { color: #687b8e; font-size: 11px; margin-right: auto; }
        .tc-save { border: 1px solid #cddadf; background: white; font-size: 20px; padding: 5px 10px; border-radius: 10px; cursor: pointer; }
        .tc-apply { background: #064b3a; border-radius: 11px; padding: 10px 11px; color: white !important; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .tc-empty { background: #fff; border-radius: 16px; padding: 48px; text-align: center; color: #617487; }
        .tc-pipeline { margin-top: 24px; }
        .tc-tabs { display: flex; gap: 8px; overflow-x: auto; padding: 4px 0 17px; }
        .tc-tab { border: 1px solid #e1e6eb; border-radius: 30px; background: #fff; color: #354659; padding: 10px 15px; cursor: pointer; text-transform: capitalize; white-space: nowrap; font-size: 12px; }
        .tc-tab-active { background: #064b3a; color: white; }
        .tc-table-wrap { overflow-x: auto; }.tc-table-wrap table { width: 100%; border-collapse: collapse; min-width: 780px; text-align: left; }
        .tc-table-wrap th { background: #f7f9fb; color: #617184; font-size: 12px; font-weight: 600; }.tc-table-wrap td { font-size: 13px; }
        .tc-table-wrap td, .tc-table-wrap th { padding: 15px 13px; border-bottom: 1px solid #edf0f4; }
        .tc-table-wrap td a { color: #08785e; font-weight: 700; }.tc-no-apps { text-align: center; color: #718294; padding: 36px !important; }
        .tc-status { background: #edf2f8; border-radius: 20px; padding: 6px 10px; display: inline-block; font-size: 11px; text-transform: capitalize; }
        .tc-status.approved { background: #ddf5e9; color: #056347; }
        .tc-bottom { margin-top: 19px; display: flex; gap: 24px; font-size: 12px; font-weight: 700; color: #08785e; }
        @media (max-width: 1250px) { .tc-job-grid { grid-template-columns: repeat(3, minmax(200px, 1fr)); } }
        @media (max-width: 780px) { .tc-header { padding: 14px; }.tc-container { padding: 14px; }.tc-nav { order: 3; width: 100%; }.tc-job-grid { grid-template-columns: repeat(2, minmax(160px, 1fr)); }.tc-search-button { width: 100%; } }
        @media (max-width: 500px) { .tc-job-grid { grid-template-columns: 1fr; }.tc-heading-row h1 { font-size: 21px; } }
      `}</style>
    </main>
  );
}
