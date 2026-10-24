import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkResumeFile, cleanLabel, resumeStoragePath, MAX_RESUME_BYTES } from "../src/lib/resumes/validate.ts";
import { formatBytes } from "../src/components/ui/ResumeCard.tsx";

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const U = "11111111-1111-1111-1111-111111111111";

test("accepts PDF and DOCX within 5 MB", () => {
  assert.deepEqual(checkResumeFile({ name: "cv.PDF", type: PDF, size: 1000 }), { ok: true, ext: "pdf" });
  assert.deepEqual(checkResumeFile({ name: "cv.docx", type: DOCX, size: MAX_RESUME_BYTES }), { ok: true, ext: "docx" });
});

test("rejects other types, mismatched extensions, empty and oversized files", () => {
  assert.ok(!checkResumeFile({ name: "cv.exe", type: "application/x-msdownload", size: 10 }).ok);
  assert.ok(!checkResumeFile({ name: "cv.pdf.exe", type: PDF, size: 10 }).ok);
  assert.ok(!checkResumeFile({ name: "cv.pdf", type: PDF, size: 0 }).ok);
  assert.ok(!checkResumeFile({ name: "cv.pdf", type: PDF, size: MAX_RESUME_BYTES + 1 }).ok);
});

test("storage path is scoped to the user folder and rejects traversal", () => {
  assert.equal(resumeStoragePath(U, U, "pdf"), `${U}/${U}.pdf`);
  assert.throws(() => resumeStoragePath("../other", U, "pdf"));
});

test("labels are trimmed and bounded", () => {
  assert.equal(cleanLabel("  Data   Eng "), "Data Eng");
  assert.equal(cleanLabel("   "), null);
  assert.equal(cleanLabel("x".repeat(200))!.length, 80);
  assert.equal(formatBytes(2048), "2 KB");
});

test("migration 004 enables RLS and owner-only policies for saved jobs and resume storage", () => {
  const sql = readFileSync("supabase/migrations/004_saved_jobs_resumes_storage.sql", "utf8");
  assert.match(sql, /saved_jobs enable row level security/);
  assert.match(sql, /primary key \(user_id, job_id\)/);
  assert.match(sql, /'resumes', 'resumes', false, 5242880/);
  assert.match(sql, /storage\.foldername\(name\)\)\[1\] = \(select auth\.uid\(\)\)::text/);
  assert.ok(!/\bdrop\b|\btruncate\b|\bdelete from\b/i.test(sql), "must be non-destructive");
});

test("all migrations are non-destructive", () => {
  for (const f of ["002_profile_onboarding.sql", "003_jobs_worldwide_filters.sql", "004_saved_jobs_resumes_storage.sql"]) {
    assert.ok(!/\bdrop\s+(table|column)|\btruncate\b|\bdelete\s+from\b/i.test(readFileSync(`supabase/migrations/${f}`, "utf8")), f);
  }
});
