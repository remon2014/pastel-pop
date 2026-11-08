// PreToolUse hook (Bash): before any `git commit`, run tests and lint.
// Blocks the commit if either fails, and tells Claude why.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const input = JSON.parse(readFileSync(0, "utf8"));
const command = input?.tool_input?.command || "";
if (!/\bgit\s+commit\b/.test(command)) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
// Adjust these to match the script names in package.json.
const checks = [
  ["tests", "npm test --silent"],
  ["lint", "npm run lint --silent"],
];

for (const [name, cmd] of checks) {
  try {
    execSync(cmd, { cwd: projectDir, stdio: "pipe", encoding: "utf8" });
  } catch (err) {
    const output = `${err.stdout || ""}${err.stderr || ""}`.trim();
    console.error(`Commit blocked: ${name} failed. Fix the problem, then commit again.\n${output.slice(-3000)}`);
    process.exit(2);
  }
}
