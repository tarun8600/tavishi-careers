import { DEFAULT_COUNTRY, WORLDWIDE, normalizeCountry } from "../design/countries.ts";

export const WORKPLACES = ["remote", "hybrid", "onsite"] as const;
export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contract", "temporary", "internship", "freelance"] as const;
export const SENIORITIES = ["intern", "entry", "mid", "senior", "lead", "manager", "director", "executive"] as const;
export const CURRENCIES = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "CHF", "JPY", "SGD", "AED"] as const;
export const SORTS = ["newest", "salary"] as const;
export const PAGE_SIZE = 20;

export const LABELS: Record<string, string> = {
  remote: "Remote", hybrid: "Hybrid", onsite: "Onsite",
  full_time: "Full-time", part_time: "Part-time", contract: "Contract", temporary: "Temporary", internship: "Internship", freelance: "Freelance",
  intern: "Intern", entry: "Entry level", mid: "Mid level", senior: "Senior", lead: "Lead", manager: "Manager", director: "Director", executive: "Executive",
};

export type JobFilters = {
  q: string;
  country: string; // ISO alpha-2 or "WW"
  city: string;
  workplace: (typeof WORKPLACES)[number][];
  employment: (typeof EMPLOYMENT_TYPES)[number][];
  seniority: (typeof SENIORITIES)[number][];
  industry: string;
  salaryMin: number | null;
  currency: (typeof CURRENCIES)[number] | null;
  sort: (typeof SORTS)[number];
  page: number;
};

type Params = { get(name: string): string | null; getAll(name: string): string[] };

const clean = (v: string | null, max = 100) =>
  (v ?? "").replace(/[^\p{L}\p{N}\s.+#&'\-/]/gu, " ").replace(/\s+/g, " ").trim().slice(0, max);

function multi<T extends string>(p: Params, key: string, allowed: readonly T[]): T[] {
  const values = p.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim().toLowerCase());
  return [...new Set(values.filter((v): v is T => (allowed as readonly string[]).includes(v)))];
}

/** Parse untrusted query params into safe, normalized filters. Invalid values are dropped. */
export function parseJobFilters(p: Params): JobFilters {
  const rawCountry = p.get("country");
  const salary = Number.parseInt(p.get("salary_min") ?? "", 10);
  const cur = (p.get("currency") ?? "").toUpperCase();
  const page = Number.parseInt(p.get("page") ?? "1", 10);
  const sort = p.get("sort");
  return {
    q: clean(p.get("q")),
    country: rawCountry ? normalizeCountry(rawCountry) : DEFAULT_COUNTRY,
    city: clean(p.get("city")),
    workplace: multi(p, "workplace", WORKPLACES),
    employment: multi(p, "employment", EMPLOYMENT_TYPES),
    seniority: multi(p, "seniority", SENIORITIES),
    industry: clean(p.get("industry"), 60),
    salaryMin: Number.isFinite(salary) && salary > 0 && salary < 100_000_000 ? salary : null,
    currency: (CURRENCIES as readonly string[]).includes(cur) ? (cur as JobFilters["currency"]) : null,
    sort: sort === "salary" ? "salary" : "newest",
    page: Number.isFinite(page) && page >= 1 && page <= 500 ? page : 1,
  };
}

export function filtersToQuery(f: Partial<JobFilters>): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.country && f.country !== DEFAULT_COUNTRY) sp.set("country", f.country);
  if (f.city) sp.set("city", f.city);
  if (f.workplace?.length) sp.set("workplace", f.workplace.join(","));
  if (f.employment?.length) sp.set("employment", f.employment.join(","));
  if (f.seniority?.length) sp.set("seniority", f.seniority.join(","));
  if (f.industry) sp.set("industry", f.industry);
  if (f.salaryMin) sp.set("salary_min", String(f.salaryMin));
  if (f.currency) sp.set("currency", f.currency);
  if (f.sort && f.sort !== "newest") sp.set("sort", f.sort);
  if (f.page && f.page > 1) sp.set("page", String(f.page));
  return sp.toString();
}

export const isWorldwide = (f: JobFilters) => f.country === WORLDWIDE;

/** Minimal query-builder interface so the filter logic can be unit-tested without Supabase. */
export interface FilterableQuery<Q> {
  eq(col: string, v: unknown): Q; in(col: string, v: unknown[]): Q; ilike(col: string, v: string): Q;
  or(expr: string): Q; gte(col: string, v: number): Q;
  order(col: string, o: { ascending: boolean; nullsFirst?: boolean }): Q; range(from: number, to: number): Q;
}

const like = (s: string) => `%${s.replace(/[%_,()]/g, " ").trim()}%`;

export function applyJobFilters<Q extends FilterableQuery<Q>>(query: Q, f: JobFilters): Q {
  let q = query.eq("is_active", true);
  if (!isWorldwide(f)) q = q.eq("country_code", f.country);
  if (f.q) q = q.or(`title.ilike.${like(f.q)},company.ilike.${like(f.q)}`);
  if (f.city) q = q.ilike("city", like(f.city));
  if (f.workplace.length) q = q.in("workplace_type", f.workplace);
  if (f.employment.length) q = q.in("employment_type", f.employment);
  if (f.seniority.length) q = q.in("seniority", f.seniority);
  if (f.industry) q = q.ilike("industry", like(f.industry));
  if (f.salaryMin) {
    q = q.gte("salary_max", f.salaryMin);
    if (f.currency) q = q.eq("salary_currency", f.currency);
  }
  q = f.sort === "salary"
    ? q.order("salary_max", { ascending: false, nullsFirst: false })
    : q.order("posted_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false });
  const from = (f.page - 1) * PAGE_SIZE;
  return q.range(from, from + PAGE_SIZE - 1);
}
