
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const origin = request.headers.get("origin");

    if (origin !== request.nextUrl.origin) {
      return NextResponse.json(
        { error: "Invalid request origin" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (!UUID_PATTERN.test(id)) {
      return NextResponse.json(
        { error: "Invalid application ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const action = body?.action;
    const resumeId = body?.resumeId;

    if (
      action !== "change_resume" &&
      action !== "withdraw"
    ) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    if (
      action === "change_resume" &&
      (typeof resumeId !== "string" ||
        !UUID_PATTERN.test(resumeId))
    ) {
      return NextResponse.json(
        { error: "Valid resume ID required" },
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
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { error } = await supabase.rpc(
      "manage_draft_application",
      {
        p_application_id: id,
        p_action: action,
        p_resume_id:
          action === "change_resume" ? resumeId : null,
      }
    );

    if (error) {
      console.error(
        "Application update failed:",
        error.message
      );

      return NextResponse.json(
        {
          error:
            "Unable to update draft. Check its status and selected resume.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "withdraw"
          ? "Application draft withdrawn successfully"
          : "Application resume updated successfully",
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
