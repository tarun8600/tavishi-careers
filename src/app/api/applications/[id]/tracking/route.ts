import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { canTrack, parseTrackingInput, type Status } from "@/lib/applications/tracking";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  const { id } = await params;
  if (!UUID.test(id)) return NextResponse.json({ error: "Invalid application ID" }, { status: 400 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const input = parseTrackingInput(body);
  if (!input.ok) return NextResponse.json({ error: input.error }, { status: 422 });

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: app, error: readErr } = await supabase.from("applications").select("id,status").eq("id", id).eq("user_id", user.id).maybeSingle();
  if (readErr || !app) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  if (!canTrack(app.status as Status, input.value.status)) {
    return NextResponse.json({ error: `Cannot change status from ${app.status} to ${input.value.status}` }, { status: 409 });
  }

  // DB function re-checks ownership + transition and writes an immutable event row atomically (migration 005).
  const { error } = await supabase.rpc("record_application_event", {
    p_application_id: id, p_status: input.value.status, p_note: input.value.note,
    p_interview_at: input.value.interview_at, p_follow_up_at: input.value.follow_up_at,
  });
  if (error) {
    console.error("Tracking update failed:", error.code);
    return NextResponse.json({ error: "Unable to update application" }, { status: 400 });
  }
  return NextResponse.json({ success: true, status: input.value.status });
}
