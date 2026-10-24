import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx|css)$/.test(f)) files.push(p); } })("src");

test("no dark-mode or black backgrounds anywhere (light-only)", () => {
  for (const f of files) {
    const s = readFileSync(f, "utf8");
    assert.ok(!/prefers-color-scheme:\s*dark/.test(s), `${f} has dark mode`);
    assert.ok(!/background(-color)?:\s*(#000\b|#000000|black|#0[0-9a-f]{5}\b|#1[0-9a-f]{5}\b)/i.test(s), `${f} has a dark background`);
  }
});

test("pages use theme tokens instead of legacy hard-coded colors", () => {
  for (const f of files.filter((f) => f.startsWith(join("src", "app")) && f.endsWith(".tsx"))) {
    assert.ok(!/#10233f|#155a91|#dce3ed/i.test(readFileSync(f, "utf8")), `${f} uses legacy colors`);
  }
});

test("root layout renders shared Nav and imports globals", () => {
  const s = readFileSync("src/app/layout.tsx", "utf8");
  assert.match(s, /<Nav \/>/);
  assert.match(s, /globals\.css/);
});
