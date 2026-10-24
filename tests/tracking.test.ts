import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { canTrack, parseTrackingInput, summarize } from "../src/lib/applications/tracking.ts";

test("users can only record post-submission outcomes", () => {
  assert.ok(canTrack("submitted", "interview"));
  assert.ok(canTrack("external_pending", "rejected"));
  assert.ok(canTrack("interview", "offer"));
  assert.ok(!canTrack("approved", "submitted"), "submission is never user-settable");
  assert.ok(!canTrack("draft", "interview"));
  assert.ok(!canTrack("rejected", "offer"));
  assert.ok(!canTrack("submitted", "offer"));
});

test("tracking input validation", () => {
  const now = new Date("2026-10-24T00:00:00Z");
  assert.ok(parseTrackingInput({ status: "interview", interview_at: "2026-11-01T10:00:00Z", follow_up_at: "2026-11-02" }, now).ok);
  assert.ok(!parseTrackingInput({ status: "hired" }, now).ok);
  assert.ok(!parseTrackingInput({ status: "interview", interview_at: "not a date" }, now).ok);
  assert.ok(!parseTrackingInput({ status: "interview", follow_up_at: "2020-01-01" }, now).ok);
  const r = parseTrackingInput({ status: "rejected", note: "x".repeat(2000) }, now);
  assert.ok(r.ok && r.value.note!.length === 1000);
});

test("summary counts come only from provided rows", () => {
  assert.deepEqual(summarize([]), { total: 0, preparing: 0, approved: 0, sent: 0, interviews: 0, offers: 0, followUpsDue: 0 });
  const now = new Date("2026-10-24T00:00:00Z");
  const s = summarize([
    { status: "draft" }, { status: "approved" }, { status: "submitted", follow_up_at: "2026-10-20T00:00:00Z" },
    { status: "interview" }, { status: "offer" }, { status: "rejected", follow_up_at: "2026-10-01T00:00:00Z" },
  ], now);
  assert.equal(s.total, 6); assert.equal(s.preparing, 1); assert.equal(s.sent, 4); assert.equal(s.interviews, 2); assert.equal(s.followUpsDue, 1);
});

test("migration 005 events are append-only and the RPC re-checks transitions", () => {
  const sql = readFileSync("supabase/migrations/005_application_tracking.sql", "utf8");
  assert.match(sql, /application_events enable row level security/);
  assert.ok(!/policy[^;]+on public\.application_events for (insert|update|delete)/i.test(sql));
  assert.match(sql, /user_id = auth\.uid\(\) for update/);
  assert.match(sql, /revoke all on function public\.record_application_event[^;]+from public, anon/);
  assert.ok(!/\bdrop\s+(table|column)|\btruncate\b/i.test(sql));
});
