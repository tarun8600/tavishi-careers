// Configuration loader for Tavishi Careers. Never logs or returns secret values in messages.
import { readFileSync, existsSync } from "node:fs";

export const PROFILES = ["dev", "qa", "prod"];
export const MODES = ["dev", "build", "start"];
export const REQUIRED_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_IMPORT_SECRET",
  "GREENHOUSE_BOARD_TOKEN",
  "GREENHOUSE_COMPANY_NAME",
];

export function parseEnvFile(text) {
  const values = {};
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
      v = v.slice(1, -1);
    }
    values[m[1]] = v;
  }
  return values;
}

export function readLocalEnv(path = ".env.local") {
  return existsSync(path) ? parseEnvFile(readFileSync(path, "utf8")) : {};
}

export function findMissing(env, required = REQUIRED_VARS) {
  return required.filter((k) => typeof env[k] !== "string" || env[k].trim() === "");
}

export function parseArgs(argv) {
  const opts = { profile: "dev", mode: "dev", port: 3002, inner: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i].replace(/^--?/, "").toLowerCase();
    const next = () => {
      if (i + 1 >= argv.length) throw new ConfigError(`Missing value for --${a}`);
      return argv[++i];
    };
    if (a === "profile") opts.profile = next().toLowerCase();
    else if (a === "mode") opts.mode = next().toLowerCase();
    else if (a === "port") opts.port = Number(next());
    else if (a === "inner") opts.inner = true;
    else throw new ConfigError(`Unknown argument: ${argv[i]}`);
  }
  if (!PROFILES.includes(opts.profile)) throw new ConfigError(`Invalid profile. Use one of: ${PROFILES.join(", ")}`);
  if (!MODES.includes(opts.mode)) throw new ConfigError(`Invalid mode. Use one of: ${MODES.join(", ")}`);
  if (!Number.isInteger(opts.port) || opts.port < 1 || opts.port > 65535) throw new ConfigError("Invalid port.");
  if (opts.profile === "prod" && opts.mode === "dev") {
    throw new ConfigError("For prod, specify --mode build or --mode start and use a production deployment.");
  }
  return opts;
}

/** Decide config source: complete local DEV config wins; otherwise Infisical cloud. */
export function chooseSource(profile, localEnv) {
  return profile === "dev" && findMissing(localEnv).length === 0 ? "local" : "infisical";
}

export class ConfigError extends Error {}

export function assertConfig(env, profile) {
  const missing = findMissing(env);
  if (missing.length) {
    throw new ConfigError(
      `Missing required configuration for profile '${profile}': ${missing.join(", ")}. ` +
        "Set them in .env.local (dev) or in Infisical for this environment.",
    );
  }
}
