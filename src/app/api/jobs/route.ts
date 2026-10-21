
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const searchParams = request.nextUrl.searchParams;

    const query = (searchParams.get("query") ?? "")
      .trim()
      .slice(0, 100);

    const location = (searchParams.get("location") ?? "")
      .trim()
      .slice(0, 100);

    let jobQuery = supabase
      .from("jobs")
      .select(
        "id,title,company,location,description,apply_url,created_at"
      )
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(100);

    if (query) {
      const safeQuery = query.replace(/[(),]/g, " ").trim();

      if (safeQuery) {
        jobQuery = jobQuery.or(
          `title.ilike.%${safeQuery}%,company.ilike.%${safeQuery}%`
        );
      }
    }

    if (location) {
      const safeLocation = location
        .replace(/[%_]/g, "")
        .trim();

      if (safeLocation) {
        jobQuery = jobQuery.ilike(
          "location",
          `%${safeLocation}%`
        );
      }
    }

    const { data, error } = await jobQuery;

    if (error) {
      console.error("Jobs API error:", error.message);

      return NextResponse.json(
        {
          error: "Unable to load jobs",
          jobs: [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      jobs: data ?? [],
      demo: false,
      count: data?.length ?? 0,
    });
  } catch (error) {
    console.error("Jobs API failure:", error);

    return NextResponse.json(
      {
        error: "Unable to process jobs request",
        jobs: [],
      },
      { status: 500 }
    );
  }
}
