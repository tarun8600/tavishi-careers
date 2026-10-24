import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { applyJobFilters, parseJobFilters, PAGE_SIZE, type FilterableQuery } from "@/lib/jobs/filters";

type JobsResult = { data: unknown[] | null; error: { code?: string } | null; count: number | null };
interface JobsQuery extends FilterableQuery<JobsQuery>, PromiseLike<JobsResult> {}

const JOB_COLUMNS =
  "id,title,company,location,country_code,city,workplace_type,employment_type,seniority,industry,salary_min,salary_max,salary_currency,salary_period,apply_url,posted_at,created_at";

export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Service unavailable", jobs: [] }, { status: 503 });

  const filters = parseJobFilters(request.nextUrl.searchParams);
  try {
    // Publishable key + RLS: only active jobs are readable.
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const base = supabase.from("jobs").select(JOB_COLUMNS, { count: "exact" }) as unknown as JobsQuery;
    const query = applyJobFilters(base, filters);
    const { data, error, count } = await query;
    if (error) {
      console.error("Jobs API error:", error.code);
      return NextResponse.json({ error: "Unable to load jobs", jobs: [] }, { status: 500 });
    }
    return NextResponse.json({ jobs: data ?? [], total: count ?? 0, page: filters.page, pageSize: PAGE_SIZE, filters });
  } catch {
    return NextResponse.json({ error: "Unable to process jobs request", jobs: [] }, { status: 500 });
  }
}
