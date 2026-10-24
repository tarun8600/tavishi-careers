import { test } from "node:test";
import assert from "node:assert/strict";
import { safeNextPath, isProtectedPath } from "../src/lib/auth/redirect.ts";
import { validateProfileInput } from "../src/lib/profile/validate.ts";

test("safeNextPath allows same-origin relative paths", () => {
  assert.equal(safeNextPath("/jobs?q=x"), "/jobs?q=x");
  assert.equal(safeNextPath(null), "/dashboard");
});

test("safeNextPath blocks open redirects", () => {
  for (const bad of ["https://evil.com", "//evil.com", "/\\evil.com", "javascript:alert(1)", "/a\nb", "evil.com"]) {
    assert.equal(safeNextPath(bad), "/dashboard", bad);
  }
});

test("isProtectedPath covers private areas only", () => {
  assert.ok(isProtectedPath("/dashboard"));
  assert.ok(isProtectedPath("/resumes/123"));
  assert.ok(!isProtectedPath("/jobs"));
  assert.ok(!isProtectedPath("/profilex"));
  assert.ok(!isProtectedPath("/login"));
});

test("validateProfileInput normalizes valid input", () => {
  const r = validateProfileInput({ full_name: " Asha ", skills: "SQL, sql ,SQL, Go", country_code: "in", preferred_workplace: "remote" });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.full_name, "Asha");
    assert.deepEqual(r.value.skills, ["SQL", "sql", "Go"]);
    assert.equal(r.value.country_code, "IN");
    assert.equal(r.value.headline, null);
  }
});

test("validateProfileInput rejects bad input without echoing values", () => {
  const r = validateProfileInput({ full_name: "", country_code: "India", preferred_workplace: "moon", id: "someone-else" });
  assert.ok(!r.ok);
  if (!r.ok) assert.deepEqual(Object.keys(r.errors).sort(), ["country_code", "full_name", "preferred_workplace"]);
});

test("validateProfileInput ignores client-supplied id", () => {
  const r = validateProfileInput({ full_name: "A", id: "x" });
  assert.ok(r.ok && !("id" in r.value));
});

test("validateProfileInput handles non-object bodies", () => {
  assert.ok(!validateProfileInput(null).ok);
  assert.ok(!validateProfileInput("x").ok);
});
