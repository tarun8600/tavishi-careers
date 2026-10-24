"use client";
import { CountrySelector } from "@/components/ui";
import { CURRENCIES, EMPLOYMENT_TYPES, LABELS, SENIORITIES, WORKPLACES, type JobFilters } from "@/lib/jobs/filters";

type Multi = "workplace" | "employment" | "seniority";

export function SearchFilters({ value, onChange }: { value: JobFilters; onChange: (f: JobFilters) => void }) {
  const set = (patch: Partial<JobFilters>) => onChange({ ...value, ...patch, page: 1 });
  const toggle = (key: Multi, v: string) => {
    const cur = value[key] as string[];
    set({ [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] } as Partial<JobFilters>);
  };
  const chips = (key: Multi, opts: readonly string[], label: string) => (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
      <legend style={{ fontWeight: 500, marginBottom: 6 }}>{label}</legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {opts.map((o) => {
          const on = (value[key] as string[]).includes(o);
          return (
            <button key={o} type="button" aria-pressed={on} onClick={() => toggle(key, o)}
              className={`tc-btn ${on ? "tc-btn-primary" : "tc-btn-secondary"}`} style={{ minHeight: 36, padding: "0 .8rem", fontSize: ".875rem" }}>
              {LABELS[o]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );

  return (
    <form role="search" className="tc-card" style={{ display: "grid", gap: 16 }} onSubmit={(e) => e.preventDefault()}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <label className="tc-field" style={{ margin: 0 }}><span>Keywords</span>
          <input type="search" value={value.q} placeholder="Title or company" onChange={(e) => set({ q: e.target.value })} />
        </label>
        <div style={{ margin: 0 }}><CountrySelector value={value.country} onChange={(country) => set({ country })} /></div>
        <label className="tc-field" style={{ margin: 0 }}><span>City</span>
          <input value={value.city} placeholder="Any city" onChange={(e) => set({ city: e.target.value })} />
        </label>
        <label className="tc-field" style={{ margin: 0 }}><span>Industry</span>
          <input value={value.industry} placeholder="All industries" onChange={(e) => set({ industry: e.target.value })} />
        </label>
      </div>
      {chips("workplace", WORKPLACES, "Workplace")}
      {chips("employment", EMPLOYMENT_TYPES, "Employment type")}
      {chips("seniority", SENIORITIES, "Seniority")}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <label className="tc-field" style={{ margin: 0 }}><span>Minimum salary</span>
          <input inputMode="numeric" value={value.salaryMin ?? ""} placeholder="Any"
            onChange={(e) => { const n = parseInt(e.target.value.replace(/\D/g, ""), 10); set({ salaryMin: Number.isFinite(n) && n > 0 ? n : null }); }} />
        </label>
        <label className="tc-field" style={{ margin: 0 }}><span>Currency</span>
          <select value={value.currency ?? ""} onChange={(e) => set({ currency: (e.target.value || null) as JobFilters["currency"] })}>
            <option value="">Any</option>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="tc-field" style={{ margin: 0 }}><span>Sort by</span>
          <select value={value.sort} onChange={(e) => set({ sort: e.target.value as JobFilters["sort"] })}>
            <option value="newest">Newest</option><option value="salary">Highest salary</option>
          </select>
        </label>
      </div>
    </form>
  );
}
