import { LABELS } from "@/lib/jobs/filters";
import { countryName } from "@/lib/design/countries";

export type Job = {
  id: string; title: string; company: string; location: string | null; country_code: string | null; city: string | null;
  workplace_type: string | null; employment_type: string | null; seniority: string | null; industry: string | null;
  salary_min: number | null; salary_max: number | null; salary_currency: string | null; salary_period: string | null;
  apply_url: string | null; posted_at: string | null; created_at: string;
};

export function formatSalary(j: Pick<Job, "salary_min" | "salary_max" | "salary_currency" | "salary_period">): string | null {
  if (j.salary_min == null && j.salary_max == null) return null;
  const cur = j.salary_currency ?? "";
  const fmt = (n: number) => {
    try { return cur ? new Intl.NumberFormat("en", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n) : n.toLocaleString("en"); }
    catch { return `${cur} ${n.toLocaleString("en")}`; }
  };
  const range = j.salary_min != null && j.salary_max != null && j.salary_min !== j.salary_max
    ? `${fmt(j.salary_min)} – ${fmt(j.salary_max)}` : fmt((j.salary_max ?? j.salary_min)!);
  return j.salary_period ? `${range} / ${j.salary_period}` : range;
}

export function jobPlace(j: Pick<Job, "city" | "country_code" | "location">): string {
  const parts = [j.city, j.country_code ? countryName(j.country_code) : null].filter(Boolean);
  return parts.length ? parts.join(", ") : j.location || "Location not specified";
}

export function JobCard({ job, saved, onSave, onDraft, busy }: { job: Job; saved: boolean; onSave: () => void; onDraft: () => void; busy: boolean }) {
  const salary = formatSalary(job);
  const tags = [job.workplace_type, job.employment_type, job.seniority].filter(Boolean) as string[];
  const posted = job.posted_at ?? job.created_at;
  return (
    <article className="tc-card tc-card-hover" style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h3 style={{ marginBottom: 2 }}>{job.title}</h3>
          <p style={{ margin: 0, color: "var(--primary-strong)", fontWeight: 600 }}>{job.company}</p>
        </div>
        <small className="tc-hint">Posted {new Date(posted).toLocaleDateString("en", { dateStyle: "medium" })}</small>
      </div>
      <p className="tc-hint" style={{ margin: 0 }}>{jobPlace(job)}{job.industry ? ` · ${job.industry}` : ""}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tags.map((t, i) => <span key={t} className={`tc-badge tc-tone-${["mint", "sky", "lavender"][i]}`}>{LABELS[t] ?? t}</span>)}
        {salary && <span className="tc-badge tc-tone-yellow">{salary}</span>}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
        <button type="button" className="tc-btn tc-btn-secondary" onClick={onSave} disabled={busy} aria-pressed={saved}>{saved ? "Saved" : "Save"}</button>
        <button type="button" className="tc-btn tc-btn-primary" onClick={onDraft} disabled={busy}>Prepare draft</button>
        {job.apply_url && <a className="tc-btn tc-btn-ghost" href={job.apply_url} target="_blank" rel="noopener noreferrer">Employer posting ↗</a>}
      </div>
    </article>
  );
}
