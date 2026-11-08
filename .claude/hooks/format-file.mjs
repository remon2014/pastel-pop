// PostToolUse hook: format and lint each file right after Claude edits it.
// Reports remaining lint problems back to Claude so it fixes them straight away.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const file = input?.tool_input?.file_path;
if (!file) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const rel = path.relative(projectDir, path.resolve(file));
const checkable = /\.(js|mjs|cjs|json|css)$/.test(file);
const skipped = rel.startsWith("..") || /^(node_modules|dist)[\\/]/.test(rel);
if (!checkable || skipped) process.exit(0);

try {
  execFileSync(
    "npx",
    ["--no-install", "biome", "check", "--write", "--no-errors-on-unmatched", rel],
    { cwd: projectDir, stdio: "pipe", encoding: "utf8" },
  );
} catch (err) {
  const output = `${err.stdout || ""}${err.stderr || ""}`.trim();
  console.error(`Lint problems remain in ${rel} after auto-fix. Please fix them:\n${output.slice(-3000)}`);
  process.exit(2);
}
