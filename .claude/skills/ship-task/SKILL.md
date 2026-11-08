---
name: ship-task
description: Run one planned task end to end through the team loop (tech lead check, engineer build, QA and code review, fixes) and stop for the owner's approval before merging. Use when the owner types /ship-task with a task ID such as F-11.
argument-hint: "[task-id, e.g. F-11]"
disable-model-invocation: true
---

# Ship a task: $ARGUMENTS

Run task **$ARGUMENTS** through the team loop. You are the coordinator: you hand work to the agents and keep the owner informed. **Never write or fix game code yourself**; that is the engineer's job, and the checks only mean something if the right agents do them.

## Hard rules
- Never skip QA or code review for a task that changes code.
- Never merge without the owner's explicit approval in this conversation.
- Never push to GitHub unless the owner says so.
- Never weaken, skip or delete tests to get a pass. The commit hook runs tests and lint; if it blocks a commit, the engineer fixes the cause.
- If anything is unclear or blocked, stop and ask rather than guess.

## 1. Pre-flight
- Confirm the working tree is clean and you're on `main`, up to date. If not, stop and tell the owner.
- Find task $ARGUMENTS in `docs/foundations-plan.md` (or `docs/backlog.md`). If it's missing, or its dependencies aren't merged, stop and say so.
- Note the task's acceptance criteria, likely files and QA method. Pass these short extracts to agents, not whole documents.

## 2. Tech lead check
Ask the **tech-lead** agent to confirm the task is ready: criteria still right, no design gaps, and any decisions needed.
- If it's ready and unchanged, continue without stopping.
- If the tech lead changed the acceptance criteria or needs a decision, show the owner a short summary and wait for approval.
- If it needs the game-designer or wellbeing-advisor first, stop and tell the owner who to ask and what.

## 3. Branch
Create a branch from `main` named after the task, for example `f-11-layout`.

## 4. Build
Hand the task to the **gameplay-engineer** agent with the task ID, acceptance criteria and branch name.
- If the engineer reports **"built, not verified"** or a blocker, stop and show the owner what's needed.

## 5. Check
Run the **qa-tester** and **code-reviewer** agents on the branch. Give each the task ID, acceptance criteria and the engineer's report. Run them in parallel where possible.

For a docs-only task, skip the engineer and QA; the code reviewer checks the docs change.

## 6. Fix loop
If QA returns **FAIL** or the reviewer returns **CHANGES REQUESTED**:
1. Send the engineer the QA bugs and the reviewer's must-fix items only.
2. Re-run only the checker that failed, on the fixes plus anything they could affect.
3. Repeat at most **3 rounds**. If it still isn't passing, stop and give the owner a summary of what keeps failing.

If either returns **BLOCKED** or **NOT ASSESSED**, stop and tell the owner what's missing (for example, a browser tool or a real phone).

## 7. Approval gate
When QA passes and the reviewer approves, show the owner a short summary and **wait**:

- **Task:** ID and one line on what it does
- **Changes:** what changed, in plain words
- **QA:** verdict, plus any manual real-phone checks needed
- **Review:** verdict, plus should-fix items and nits being deferred
- **Flags:** anything raised for the game-designer, wellbeing-advisor or tech-lead
- **Question:** "Merge to main?"

## 8. Merge and tidy up (only after approval)
1. Merge the branch into `main` the same way earlier tasks were merged, then delete the branch.
2. Mark the task done in `docs/foundations-plan.md`.
3. Add deferred should-fix items, nits and real-phone questions to `docs/backlog.md`, each tagged with the task ID.
4. Confirm tests, lint and build pass on `main`.
5. Report the merge in one or two lines, and name the next task in the plan. Don't push unless the owner asks.

## Efficiency
- Pass agents short, specific context; let them read files themselves.
- Keep your own messages to the owner brief: what happened, and what you need from them.
- Don't re-plan a task the tech lead has already planned unless something has changed.
