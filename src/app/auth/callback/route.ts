import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeNextPath } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;
  const next = safeNextPath(url.searchParams.get("next"));

  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", origin));

  const response = NextResponse.redirect(new URL(next, origin));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    console.error("Google OAuth callback failed:", { code: error?.code, status: error?.status });
    return NextResponse.redirect(new URL("/login?error=oauth_failed", origin));
  }

  // First sign-in: send to onboarding until the profile is completed.
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded_at")
    .eq("id", data.user.id)
    .maybeSingle();
  if (!profile?.onboarded_at) {
    response.headers.set("location", new URL(`/onboarding?next=${encodeURIComponent(next)}`, origin).toString());
  }
  return response;
}
