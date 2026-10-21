
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

type GreenhouseJob = {
  id: number;
  title: string;
  internal_job_id?: number | null;
  location?: { name?: string };
  absolute_url: string;
  content?: string;
};

function authorized(received: string | null, secret: string) {
  if (!received || !secret) return false;

  const actual = Buffer.from(received);
  const expected = Buffer.from(`Bearer ${secret}`);

  return (
    actual.length === expected.length &&
    timingSafeEqual(actual, expected)
  );
}

// Decode HTML entities, including nested encoded content.
function decodeEntities(value: string) {
  return value.replace(
    /&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|nbsp);/gi,
    (match, entity: string) => {
      const name = entity.toLowerCase();

      const named: Record<string, string> = {
        amp: "&",
        lt: "<",
        gt: ">",
        quot: '"',
        apos: "'",
        nbsp: " ",
      };

      if (name in named) {
        return named[name];
      }

      let codePoint: number;

      if (name.startsWith("#x")) {
        codePoint = parseInt(name.slice(2), 16);
      } else if (name.startsWith("#")) {
        codePoint = parseInt(name.slice(1), 10);
      } else {
        return match;
      }

      if (
        !Number.isInteger(codePoint) ||
        codePoint < 0 ||
        codePoint > 0x10ffff ||
        (codePoint >= 0xd800 && codePoint <= 0xdfff)
      ) {
        return " ";
      }

      return String.fromCodePoint(codePoint);
    }
  );
}

// Convert Greenhouse HTML descriptions into readable plain text.
function cleanDescription(html: string) {
  let text = html;

  // Handle HTML that has been encoded multiple times.
  for (let i = 0; i < 4; i++) {
    const decoded = decodeEntities(text);

    if (decoded === text) {
      break;
    }

    text = decoded;
  }

  // Remove script and style blocks.
  text = text
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, " ")

    // Preserve separation between paragraphs and headings.
    .replace(
      /<(br|\/p|\/div|\/section|\/li|\/h[1-6])\b[^>]*>/gi,
      "\n"
    )

    // Remove remaining HTML tags.
    .replace(/<[^>]*>/g, " ")

    // Clean whitespace.
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return text.slice(0, 12000);
}

export async function POST(request: NextRequest) {
  const secret = process.env.ADMIN_IMPORT_SECRET;

  if (
    !secret ||
    !authorized(
      request.headers.get("authorization"),
      secret
    )
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const board = process.env.GREENHOUSE_BOARD_TOKEN;
  const company = process.env.GREENHOUSE_COMPANY_NAME;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !board ||
    !/^[a-zA-Z0-9_-]+$/.test(board) ||
    !company ||
    !url ||
    !serviceKey
  ) {
    return NextResponse.json(
      { error: "Server configuration incomplete" },
      { status: 500 }
    );
  }

  try {
    const feedUrl =
      `https://boards-api.greenhouse.io/v1/boards/` +
      `${encodeURIComponent(board)}/jobs?content=true`;

    const response = await fetch(feedUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
      redirect: "error",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Employer job feed unavailable" },
        { status: 502 }
      );
    }

    const feed: { jobs?: GreenhouseJob[] } =
      await response.json();

    if (!Array.isArray(feed.jobs)) {
      return NextResponse.json(
        { error: "Unexpected job feed response" },
        { status: 502 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const now = new Date().toISOString();
    const source = `greenhouse:${board}`;

    let imported = 0;
    let updated = 0;
    let skipped = 0;

    for (const job of feed.jobs.slice(0, 100)) {
      if (
        !Number.isSafeInteger(job.id) ||
        !job.title ||
        !job.absolute_url ||
        job.internal_job_id === null
      ) {
        skipped++;
        continue;
      }

      let originalUrl: URL;

      try {
        originalUrl = new URL(job.absolute_url);
      } catch {
        skipped++;
        continue;
      }

      if (originalUrl.protocol !== "https:") {
        skipped++;
        continue;
      }

      const externalId = String(job.id);

      const payload = {
        title: job.title.slice(0, 300),
        company: company.slice(0, 200),
        location: job.location?.name ?? null,
        description: cleanDescription(job.content ?? ""),
        apply_url: originalUrl.toString(),
        source_url: originalUrl.toString(),
        source,
        external_job_id: externalId,
        last_seen_at: now,
        is_active: true,
      };

      const { data: existing, error: lookupError } =
        await supabase
          .from("jobs")
          .select("id")
          .eq("source", source)
          .eq("external_job_id", externalId)
          .maybeSingle();

      if (lookupError) {
        throw new Error("Job lookup failed");
      }

      if (existing) {
        const { error } = await supabase
          .from("jobs")
          .update(payload)
          .eq("id", existing.id);

        if (error) {
          throw new Error("Job update failed");
        }

        updated++;
      } else {
        const { error } = await supabase
          .from("jobs")
          .insert({
            ...payload,
            first_seen_at: now,
          });

        if (error) {
          throw new Error("Job insert failed");
        }

        imported++;
      }
    }

    return NextResponse.json({
      success: true,
      source,
      imported,
      updated,
      skipped,
      message:
        "Job import finished. No applications submitted.",
    });
  } catch (error) {
    console.error("Job import failed:", error);

    return NextResponse.json(
      { error: "Job import failed" },
      { status: 500 }
    );
  }
}
