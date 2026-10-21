
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Require the request to come from our own website.
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
        { error: "Please enter Valid Application ID" },
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
        { error: "Please sign in to approve applications" },
        { status: 401 }
      );
    }

    // The database function validates ownership, draft status,
    // job availability and resume ownership, then saves
    // an approval snapshot and changes the status atomically.
    const { data: approvalId, error } = await supabase.rpc(
      "approve_draft_application",
      {
        p_application_id: id,
      }
    );

    if (error) {
      console.error("Application approval failed:", error.message);

      return NextResponse.json(
        {
          error:
            "Unable to approve application. It may no longer be an eligible draft.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      approvalId,
      status: "approved",
      message:
        "Application approved successfully. No employer submission was performed.",
    });
  } catch (error) {
    console.error("Approval API error:", error);

    return NextResponse.json(
      { error: "Unable to process approval request" },
      { status: 500 }
    );
  }
}
