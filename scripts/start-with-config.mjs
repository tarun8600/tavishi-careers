#!/usr/bin/env node
// Cross-platform launcher: node scripts/start-with-config.mjs [--profile dev|qa|prod] [--mode dev|build|start] [--port 3002]
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { parseArgs, readLocalEnv, chooseSource, assertConfig, ConfigError } from "./config.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function run(cmd, args, env) {
  // shell:false everywhere: no shell interpolation of arguments.
  const child = spawn(cmd, args, { stdio: "inherit", env, shell: false });
  child.on("error", (e) => {
    console.error(e.code === "ENOENT" ? `Command not found: ${cmd}` : `Failed to start ${cmd}.`);
    process.exit(1);
  });
  child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
}

function startNext(opts, env) {
  const nextBin = createRequire(join(root, "package.json")).resolve("next/dist/bin/next");
  const args = [nextBin, opts.mode];
  if (opts.mode !== "build") args.push("-p", String(opts.port));
  run(process.execPath, args, env);
}

try {
  const argv = process.argv.slice(2);
  const opts = parseArgs(argv);
  if (opts.inner) {
    // Running inside `infisical run`: secrets are already in process.env.
    assertConfig(process.env, opts.profile);
    console.log(`Configuration validated for profile '${opts.profile}'.`);
    startNext(opts, process.env);
  } else {
    const local = readLocalEnv();
    if (chooseSource(opts.profile, local) === "local") {
      const env = { ...process.env, ...local };
      assertConfig(env, opts.profile);
      console.log("Starting Tavishi Careers with complete local DEV configuration.");
      startNext(opts, env);
    } else {
      console.log(`Starting Tavishi Careers using Infisical profile '${opts.profile}'.`);
      const self = fileURLToPath(import.meta.url);
      run("infisical", ["run", `--env=${opts.profile}`, "--", process.execPath, self, ...argv, "--inner"], process.env);
    }
  }
} catch (e) {
  console.error(e instanceof ConfigError ? `Configuration error: ${e.message}` : "Startup failed.");
  process.exit(1);
}
