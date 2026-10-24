import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { validateProfileInput } from "@/lib/profile/validate";

const COLUMNS = "full_name,headline,skills,country_code,city,preferred_workplace,onboarded_at";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase.from("profiles").select(COLUMNS).eq("id", user.id).maybeSingle();
  if (error) {
    console.error("Profile load failed:", error.code);
    return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });
  }
  return NextResponse.json({ profile: data, email: user.email ?? null });
}

export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const result = validateProfileInput(body);
  if (!result.ok) return NextResponse.json({ error: "Validation failed", fields: result.errors }, { status: 422 });

  // id comes from the session, never the request body; RLS also enforces auth.uid() = id.
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, ...result.value, onboarded_at: new Date().toISOString() })
    .select(COLUMNS)
    .single();
  if (error) {
    console.error("Profile save failed:", error.code);
    return NextResponse.json({ error: "Unable to save profile" }, { status: 500 });
  }
  return NextResponse.json({ profile: data });
}
