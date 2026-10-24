import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, cpSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { REQUIRED_VARS, parseEnvFile, findMissing, parseArgs, chooseSource, assertConfig, ConfigError } from "../scripts/config.mjs";

const full = Object.fromEntries(REQUIRED_VARS.map((k) => [k, `secret-${k}-value`]));

test("six required variables", () => assert.equal(REQUIRED_VARS.length, 6));

test("parseEnvFile handles quotes, CRLF, comments", () => {
  const v = parseEnvFile('A="x y"\r\nB=\'z\'\r\n# C=1\nD = plain \n');
  assert.deepEqual(v, { A: "x y", B: "z", D: "plain" });
});

test("findMissing flags absent and blank", () => {
  const env = { ...full, ADMIN_IMPORT_SECRET: "  " };
  delete env.GREENHOUSE_BOARD_TOKEN;
  assert.deepEqual(findMissing(env), ["ADMIN_IMPORT_SECRET", "GREENHOUSE_BOARD_TOKEN"]);
});

test("assertConfig names missing vars but never values", () => {
  const env = { ...full };
  delete env.SUPABASE_SERVICE_ROLE_KEY;
  assert.throws(() => assertConfig(env, "qa"), (e) => {
    assert.ok(e instanceof ConfigError);
    assert.match(e.message, /SUPABASE_SERVICE_ROLE_KEY/);
    assert.doesNotMatch(e.message, /secret-/);
    return true;
  });
  assert.doesNotThrow(() => assertConfig(full, "dev"));
});

test("profile selection and validation", () => {
  assert.equal(parseArgs([]).profile, "dev");
  assert.equal(parseArgs(["--profile", "QA"]).profile, "qa");
  assert.equal(parseArgs(["-Profile", "prod", "-Mode", "start"]).mode, "start");
  assert.throws(() => parseArgs(["--profile", "staging"]), ConfigError);
  assert.throws(() => parseArgs(["--profile", "prod"]), /For prod/);
  assert.throws(() => parseArgs(["--port", "abc"]), ConfigError);
  assert.throws(() => parseArgs(["--bogus"]), ConfigError);
});

test("local-to-cloud fallback", () => {
  assert.equal(chooseSource("dev", full), "local");
  const partial = { ...full };
  delete partial.GREENHOUSE_COMPANY_NAME;
  assert.equal(chooseSource("dev", partial), "infisical");
  assert.equal(chooseSource("qa", full), "infisical");
  assert.equal(chooseSource("prod", full), "infisical");
});

test("launcher --inner exits non-zero without leaking values", () => {
  const dir = mkdtempSync(join(tmpdir(), "tc-"));
  mkdirSync(join(dir, "scripts"));
  cpSync("scripts", join(dir, "scripts"), { recursive: true });
  writeFileSync(join(dir, "package.json"), "{}");
  const env = { PATH: process.env.PATH, NEXT_PUBLIC_SUPABASE_URL: "https://leak-check.example" };
  const r = spawnSync(process.execPath, [join(dir, "scripts/start-with-config.mjs"), "--inner"], { env, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(r.stdout + r.stderr, /leak-check/);
});
