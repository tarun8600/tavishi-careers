import { test } from "node:test";
import assert from "node:assert/strict";
import { applyJobFilters, filtersToQuery, parseJobFilters, PAGE_SIZE, type FilterableQuery } from "../src/lib/jobs/filters.ts";
import { formatSalary, jobPlace } from "../src/components/jobs/JobCard.tsx";

const P = (s: string) => new URLSearchParams(s);

class Rec implements FilterableQuery<Rec> {
  calls: [string, ...unknown[]][] = [];
  private r(n: string, ...a: unknown[]) { this.calls.push([n, ...a]); return this; }
  eq(c: string, v: unknown) { return this.r("eq", c, v); }
  in(c: string, v: unknown[]) { return this.r("in", c, v); }
  ilike(c: string, v: string) { return this.r("ilike", c, v); }
  or(e: string) { return this.r("or", e); }
  gte(c: string, v: number) { return this.r("gte", c, v); }
  order(c: string, o: object) { return this.r("order", c, o); }
  range(a: number, b: number) { return this.r("range", a, b); }
}

test("defaults to United States, newest, page 1", () => {
  const f = parseJobFilters(P(""));
  assert.equal(f.country, "US"); assert.equal(f.sort, "newest"); assert.equal(f.page, 1);
  const q = applyJobFilters(new Rec(), f);
  assert.deepEqual(q.calls.slice(0, 2), [["eq", "is_active", true], ["eq", "country_code", "US"]]);
});

test("Worldwide applies no country filter; other countries are kept", () => {
  assert.ok(!applyJobFilters(new Rec(), parseJobFilters(P("country=WW"))).calls.some((c) => c[1] === "country_code"));
  for (const c of ["IN", "CA", "GB", "AU", "DE", "JP"]) assert.equal(parseJobFilters(P(`country=${c.toLowerCase()}`)).country, c);
  assert.equal(parseJobFilters(P("country=ZZ")).country, "US");
});

test("multi-value filters keep only allowed values", () => {
  const f = parseJobFilters(P("workplace=remote,HYBRID,moon&employment=full_time&employment=contract&seniority=senior,ceo"));
  assert.deepEqual(f.workplace, ["remote", "hybrid"]);
  assert.deepEqual(f.employment, ["full_time", "contract"]);
  assert.deepEqual(f.seniority, ["senior"]);
  const calls = applyJobFilters(new Rec(), f).calls;
  assert.ok(calls.some((c) => c[0] === "in" && c[1] === "workplace_type"));
});

test("keyword and city are sanitized against PostgREST filter injection", () => {
  const f = parseJobFilters(P("q=" + encodeURIComponent("eng),is_active.eq.false,(x") + "&city=" + encodeURIComponent("San%_Jose")));
  const or = applyJobFilters(new Rec(), f).calls.find((c) => c[0] === "or")![1] as string;
  assert.equal(or.split(",").length, 2);
  assert.ok(!/[()]/.test(or.replace(/^title\.ilike\.|company\.ilike\./g, "")));
  assert.ok(!f.city.includes("%") && !f.city.includes("_"));
});

test("salary filter uses salary_max >= min and optional currency", () => {
  const calls = applyJobFilters(new Rec(), parseJobFilters(P("salary_min=90000&currency=eur"))).calls;
  assert.deepEqual(calls.find((c) => c[0] === "gte"), ["gte", "salary_max", 90000]);
  assert.ok(calls.some((c) => c[0] === "eq" && c[1] === "salary_currency" && c[2] === "EUR"));
  assert.equal(parseJobFilters(P("salary_min=-5")).salaryMin, null);
  assert.equal(parseJobFilters(P("currency=XYZ")).currency, null);
});

test("pagination ranges and bounds", () => {
  assert.deepEqual(applyJobFilters(new Rec(), parseJobFilters(P("page=3"))).calls.at(-1), ["range", 2 * PAGE_SIZE, 3 * PAGE_SIZE - 1]);
  assert.equal(parseJobFilters(P("page=0")).page, 1);
  assert.equal(parseJobFilters(P("page=99999")).page, 1);
});

test("filtersToQuery round-trips and omits defaults", () => {
  assert.equal(filtersToQuery(parseJobFilters(P(""))), "");
  const f = parseJobFilters(P("q=data&country=IN&workplace=remote&salary_min=100&currency=INR&sort=salary&page=2"));
  assert.deepEqual(parseJobFilters(P(filtersToQuery(f))), f);
});

test("job card formatting shows only real data", () => {
  assert.equal(formatSalary({ salary_min: null, salary_max: null, salary_currency: "USD", salary_period: null }), null);
  assert.match(formatSalary({ salary_min: 100000, salary_max: 120000, salary_currency: "USD", salary_period: "year" })!, /\$100,000 – \$120,000 \/ year/);
  assert.equal(jobPlace({ city: "Pune", country_code: "IN", location: null }), "Pune, India");
  assert.equal(jobPlace({ city: null, country_code: null, location: "Berlin" }), "Berlin");
  assert.equal(jobPlace({ city: null, country_code: null, location: null }), "Location not specified");
});
