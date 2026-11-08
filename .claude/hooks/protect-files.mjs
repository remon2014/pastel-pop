// PreToolUse hook (Edit/Write): protect secrets and the team's own configuration.
// Secrets and signing keys are always blocked; config files need the owner's approval.
import { readFileSync } from "node:fs";
import path from "node:path";

const input = JSON.parse(readFileSync(0, "utf8"));
const file = input?.tool_input?.file_path;
if (!file) process.exit(0);

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const rel = path.relative(projectDir, path.resolve(file)).split(path.sep).join("/");
const name = path.basename(file);

const blocked =
  /^\.env(\..*)?$/.test(name) ||
  /\.(pem|key|p12|jks|keystore)$/.test(name) ||
  /^pastel_pop(\.pub)?$/.test(name) ||
  rel.includes(".ssh/");

if (blocked) {
  console.error(
    `Blocked: ${rel} holds secrets or signing keys and must never be edited by Claude. Ask the owner to handle it.`,
  );
  process.exit(2);
}

const needsApproval =
  rel === ".claude/settings.json" || rel === ".mcp.json" || rel.startsWith(".claude/hooks/");

if (needsApproval) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `${rel} controls the team's permissions, tools or hooks. Approve only if you asked for this change.`,
      },
    }),
  );
}
