# GNT — .gnt/ ORCHESTRATION SYSTEM RULES
Version: 1.0 | Adapted from AGILITY_AI_ENGINEERING_ORCHESTRATION_BLUEPRINT.md for GARUDA NEXTECH

## AUTHORITY
This is the execution layer. It does NOT replace `docs/roadmap/` (Master Wiring Map,
ABCD Team Wiring Map, Module-File-Function Mapping) or the Module Production
Lock Protocol — those remain the architectural source of truth. This system
turns their rules into trackable, automatic tasks.

## THE RULE THAT PREVENTS COLLISIONS
A task file lives in exactly ONE folder at a time. Whoever picks it up sets
`status: IN_PROGRESS` and `assigned_to: <tool>` at the top. **No tool may edit
a task file that already shows `IN_PROGRESS` with a different assignee.**
Moving a task to the next folder (e.g. `20_REVIEW/` → `30_FIX/`) is how hand-off
happens — never by two tools working the same folder stage at once.

## GATE ORDER (settles the Lock-vs-Test question)
```
FIX -> TEST -> SECURITY -> DEPENDENCY -> WIRING -> FINAL REVIEW -> 90_DONE (LOCKED)
```
A module/task is LOCKED only after ALL gates pass. Nothing is touched once in
`90_DONE/`. This matches the Module Production Lock Protocol in docs/roadmap.

## WHAT RUNS AUTOMATICALLY VS WHAT NEEDS YOU TO TRIGGER IT

**Fully automatic (GitHub Actions — fires on every push, no action from you):**
- CodeQL security scan
- Dependabot dependency checks
- CodeRabbit PR review
- Aider task-runner workflow (`.github/workflows/gnt-orchestrator.yml`) —
  picks up any task file sitting in `02_AI_TASKS/00_INBOX/`, runs Aider on it,
  runs tests, moves the file forward, commits the result — all on push.

**Needs you to explicitly ask (no free tool can trigger these unattended):**
- Claude (this chat) — you paste/point me at a task, I work it, I write PART2/result.
- Claude Code / any deep architectural decision — you run it in Termux when needed.

## FILE SAFETY (from the blueprint)
Before any edit: read the file, find its callers/callees, find its tests, note
scope of change. Never delete a file without checking imports/config/tests
first. Never claim "PASS" without evidence (diff + test output + build result).
