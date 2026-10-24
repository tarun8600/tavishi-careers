import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { currentAdminId } from "@/lib/admin/auth";

export async function GET() {
  if (!(await currentAdminId())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const supabase = await createServerSupabase();
  const [active, runs] = await Promise.all([
    supabase.from("jobs").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("ingestion_runs").select("source,started_at,finished_at,imported,updated,skipped,ok").order("started_at", { ascending: false }).limit(20),
  ]);
  return NextResponse.json({ activeJobs: active.count ?? 0, runs: runs.data ?? [] });
}
