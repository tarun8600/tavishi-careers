
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  try {
    // Reject cross-origin browser requests.
    const origin = request.headers.get("origin");
// tarun testing
    if (origin && origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const jobId = body?.jobId;
    const resumeId = body?.resumeId;

    if (
      typeof jobId !== "string" ||
      typeof resumeId !== "string" ||
      !UUID_PATTERN.test(jobId) ||
      !UUID_PATTERN.test(resumeId)
    ) {
      return NextResponse.json(
        { error: "Valid jobId and resumeId are required" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in first" },
        { status: 401 }
      );
    }

    const { data: applicationId, error } =
      await supabase.rpc("create_draft_application", {
        p_job_id: jobId,
        p_resume_id: resumeId,
      });

    if (error) {
      console.error("Draft application error:", error.message);

      return NextResponse.json(
        { error: "Unable to create draft. Check the job and resume." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        applicationId,
        status: "draft",
        message: "Draft application created successfully",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
