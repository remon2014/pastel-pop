// PreToolUse hook (Bash): before any `git commit`, check that what will be
// committed is exactly the working tree, then run tests and lint on it.
// Blocks (exit 2) and tells Claude why. Covers Claude Code only, not commits
// the owner makes in a terminal (D-012).
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const STAGE_HINT =
  "Stage everything you mean to commit with git add in a separate Bash call, then commit. " +
  "Don't chain add && commit, because this hook runs before the add.";

// Split a shell command into simple commands (on && || ; | and newlines),
// each a list of words. Quotes and $( ... ) are kept inside one word, so a
// multi-line -m message or a heredoc does not split the command.
export function splitCommands(command) {
  const commands = [];
  let words = [];
  let word = "";
  let inWord = false;
  let quote = null;
  let depth = 0;
  const endWord = () => {
    if (inWord) words.push(word);
    word = "";
    inWord = false;
  };
  const endCommand = () => {
    endWord();
    if (words.length) commands.push(words);
    words = [];
  };
  for (let i = 0; i < command.length; i++) {
    const ch = command[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === "\\" && quote === '"' && i + 1 < command.length) word += command[++i];
      else word += ch;
      continue;
    }
    if (depth > 0) {
      word += ch;
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      inWord = true;
    } else if (ch === "$" && command[i + 1] === "(") {
      word += "$(";
      i++;
      depth = 1;
      inWord = true;
    } else if (ch === "\\" && i + 1 < command.length) {
      word += command[++i];
      inWord = true;
    } else if (ch === ";" || ch === "\n" || ch === "|" || ch === "&") {
      endCommand();
      if ((ch === "|" || ch === "&") && command[i + 1] === ch) i++;
    } else if (/\s/.test(ch)) {
      endWord();
    } else {
      word += ch;
      inWord = true;
    }
  }
  endCommand();
  return commands;
}

// git options that come before the subcommand and take a separate value.
const GIT_VALUE_OPTS = new Set(["-C", "-c", "--git-dir", "--work-tree", "--namespace", "--exec-path"]);
// git commit long options that take a separate value (when not written with =).
const COMMIT_VALUE_LONG = new Set([
  "--message",
  "--file",
  "--reuse-message",
  "--reedit-message",
  "--fixup",
  "--squash",
  "--author",
  "--date",
  "--cleanup",
  "--template",
  "--trailer",
]);
// git commit short options that take a value (attached or the next word).
const COMMIT_VALUE_SHORT = new Set(["m", "F", "C", "c", "t"]);

// Returns null if the words are not a git commit, else { all, pathspecs }.
export function parseCommit(words) {
  let i = words.indexOf("git");
  if (i === -1) return null;
  i++;
  while (i < words.length && words[i].startsWith("-")) {
    const opt = words[i];
    i += GIT_VALUE_OPTS.has(opt) ? 2 : 1;
  }
  if (words[i] !== "commit") return null;
  let all = false;
  const pathspecs = [];
  for (i = i + 1; i < words.length; i++) {
    const w = words[i];
    if (w === "--") {
      pathspecs.push(...words.slice(i + 1));
      break;
    }
    if (w.startsWith("--")) {
      const name = w.split("=")[0];
      if (name === "--all") all = true;
      else if (name === "--include" || name === "--only" || name === "--pathspec-from-file") pathspecs.push(w);
      else if (COMMIT_VALUE_LONG.has(name) && !w.includes("=")) i++;
      continue;
    }
    if (w.startsWith("-") && w.length > 1) {
      for (let k = 1; k < w.length; k++) {
        const f = w[k];
        if (f === "a") all = true;
        else if (f === "i" || f === "o") pathspecs.push(w);
        else if (COMMIT_VALUE_SHORT.has(f)) {
          if (k === w.length - 1) i++;
          break;
        }
      }
      continue;
    }
    pathspecs.push(w);
  }
  return { all, pathspecs };
}

// Given `git status --porcelain` output, list what would make the commit
// differ from the working tree.
export function stagingProblems(porcelain, all) {
  const unstaged = [];
  const untracked = [];
  for (const line of porcelain.split("\n")) {
    if (!line) continue;
    const xy = line.slice(0, 2);
    const path = line.slice(3);
    if (xy === "??") untracked.push(path);
    else if (xy[1] !== " " && !all) unstaged.push(path);
  }
  return { unstaged, untracked };
}

function block(message) {
  console.error(`Commit blocked: ${message}\n${STAGE_HINT}`);
  process.exit(2);
}

function main() {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const command = input?.tool_input?.command || "";
  const commits = splitCommands(command).map(parseCommit).filter(Boolean);
  if (commits.length === 0) process.exit(0);

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();

  for (const commit of commits) {
    if (commit.pathspecs.length) {
      block(`the commit names file paths (${commit.pathspecs.join(", ")}), so tests would not run on what is committed.`);
    }
  }

  let porcelain;
  try {
    porcelain = execSync("git status --porcelain", { cwd: projectDir, stdio: "pipe", encoding: "utf8" });
  } catch (err) {
    block(`could not read git status (${String(err.stderr || err.message).trim()}).`);
  }
  const all = commits.every((c) => c.all);
  const { unstaged, untracked } = stagingProblems(porcelain, all);
  if (unstaged.length || untracked.length) {
    const lines = [];
    if (unstaged.length) lines.push(`Unstaged changes: ${unstaged.join(", ")}`);
    if (untracked.length) lines.push(`Untracked files: ${untracked.join(", ")}`);
    block(`the working tree has changes that would not be committed, so tests would not run on what is committed.\n${lines.join("\n")}`);
  }

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
}

main();
