import { test } from "node:test";
import assert from "node:assert/strict";
import { colors, contrastRatio } from "../src/lib/design/tokens.ts";
import { countryOptions, normalizeCountry, DEFAULT_COUNTRY } from "../src/lib/design/countries.ts";
import { statusMeta, APPLICATION_STATUSES } from "../src/lib/design/status.ts";

test("text pairings meet WCAG AA 4.5:1", () => {
  const pairs: [string, string][] = [
    [colors.text, colors.bg], [colors.text, colors.surface], [colors.textMuted, colors.surface], [colors.textMuted, colors.bg],
    [colors.primary, colors.surface], [colors.primary, colors.bg], [colors.primary, colors.primaryLight], ["#FFFFFF", colors.primaryStrong],
    [colors.lavenderInk, colors.lavender], [colors.peachInk, colors.peach], [colors.skyInk, colors.sky], [colors.yellowInk, colors.yellow],
    [colors.danger, colors.surface],
  ];
  for (const [fg, bg] of pairs) assert.ok(contrastRatio(fg, bg) >= 4.5, `${fg} on ${bg}`);
});

test("palette is light-only (backgrounds are light)", () => {
  for (const c of [colors.bg, colors.surface, colors.primaryLight, colors.lavender, colors.peach, colors.sky, colors.yellow]) {
    assert.ok(contrastRatio(c, "#000000") > 15, c);
  }
});

test("country default is United States, pinned order, all countries", () => {
  const opts = countryOptions();
  assert.equal(DEFAULT_COUNTRY, "US");
  assert.deepEqual(opts.slice(0, 7).map((o) => o.name), ["United States", "Worldwide", "India", "Canada", "United Kingdom", "Australia", "Germany"]);
  assert.ok(opts.length > 190);
  assert.equal(new Set(opts.map((o) => o.code)).size, opts.length);
});

test("normalizeCountry keeps valid international codes and defaults otherwise", () => {
  assert.equal(normalizeCountry("in"), "IN");
  assert.equal(normalizeCountry("ww"), "WW");
  assert.equal(normalizeCountry("XX"), "US");
  assert.equal(normalizeCountry(undefined), "US");
});

test("every application status has a labelled badge", () => {
  for (const s of ["draft","ready","approved","submitted","external_pending","interview","offer","rejected","withdrawn","failed"]) {
    assert.ok(APPLICATION_STATUSES.includes(s));
    assert.notEqual(statusMeta(s).label, "Unknown");
  }
});
