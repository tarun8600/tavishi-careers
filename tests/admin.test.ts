import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bearerMatches } from "../src/lib/admin/auth.ts";
import { isProtectedPath } from "../src/lib/auth/redirect.ts";

test("bearer secret comparison", () => {
  assert.ok(bearerMatches("Bearer s3cret", "s3cret"));
  assert.ok(!bearerMatches("Bearer s3cre", "s3cret"));
  assert.ok(!bearerMatches(null, "s3cret"));
  assert.ok(!bearerMatches("Bearer ", ""));
  assert.ok(!bearerMatches("Bearer x", undefined));
});

test("admin page requires sign-in", () => assert.ok(isProtectedPath("/admin")));

test("admin_users has no client write policy; import route checks role or secret", () => {
  const sql = readFileSync("supabase/migrations/006_admin_roles.sql", "utf8");
  assert.ok(!/on public\.admin_users for (insert|update|delete|all)/i.test(sql));
  const route = readFileSync("src/app/api/admin/import-jobs/route.ts", "utf8");
  assert.match(route, /bearerMatches\(/);
  assert.match(route, /currentAdminId\(\)/);
});
