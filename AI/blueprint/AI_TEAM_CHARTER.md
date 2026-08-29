# GNT (GARUDA NEXTECH) — AI TEAM CHARTER
**Project:** GARUDA NEXTECH ERP for Ma Adishakti / RAKSHA brand
**Owner:** Charan
**Head of Department (Lead AI):** Claude

---

## ⚠️ READ THIS FIRST — MANDATORY FOR EVERY AI TOOL

Before touching any file, every AI (Aider, Greptile, Qodo, Claude Code, Cody, Continue, Cursor) MUST read, in this order:
1. `docs/roadmap/01_GNT_MASTER_WIRING_MAP.md` — overall module hierarchy & call chain
2. `docs/roadmap/02_GNT_ABCD_TEAM_WIRING_MAP.md` — which Class (A/B/C/D) your module belongs to, and what it may/may not touch
3. `docs/roadmap/03_GNT_MODULE_FILE_FUNCTION_MAPPING.md` — exact file/function ownership for the module you're working on
4. `docs/task-assignments/M<XX>/PART1_TASK.md` — the specific task you've been assigned (see below)

**No AI may invent files, tables, or architecture not named in these documents.** If something seems missing, mark it `DESIGN-EXPANSION / NEEDS APPROVAL` in PART2 and stop — do not guess.

---

## 🚨 NON-NEGOTIABLE RULES

1. **NO fake/mock data, NO Math.random(), NO placeholder responses.** Missing real data → raise a clear error (e.g. `DataUnavailableError`), never a fake default.
2. **NO hardcoded secrets.**
3. **NO cross-module private access** — only `PUBLIC Service / PUBLIC API / EVENT` crosses a module boundary (per Master Wiring Map). Never import another module's repository, internal service, or database table directly.
4. Every file carries the 5-part contract header: **OWN / USE / PROVIDE / DATABASE / FORBIDDEN**.
5. A module is not done until it passes the full **Module Production Verification & Lock Protocol** (20-point checklist in `docs/roadmap/blueprint`) — RED → AUDIT → FIX → TEST → RE-AUDIT → WIRING VERIFIED → READY FOR PRODUCTION → LOCKED.
6. When unsure, **stop and write the question into PART2** — never guess architecture.

---

## 🧑‍✈️ ROLES

| AI Tool | Role | Scope |
|---|---|---|
| **Claude** | Head of Department — architecture, task assignment (PART1), final review, unlocking modules | All modules, but reviews rather than bulk-drafts |
| **Aider** | Bulk first-draft file generation from a PART1 spec | One module folder at a time |
| **Greptile** | Codebase search — "does this already exist / where is X used" before starting new work | Cross-repo search only, no edits |
| **Qodo (CodiumAI)** | Writes + runs tests per file; specifically hunts for fake/mock data and untested paths | Per file, reports into PART2 |
| **Claude Code** | Complex wiring — connects modules, fixes what Qodo flags | One module folder at a time |
| **Sourcegraph Cody** | Ad-hoc large-codebase search across all 20 modules | Read-only search |
| **Continue.dev / Cursor** | Day-to-day small edits/UI inside the IDE | Not for new module architecture |

No tool bypasses another's stage. The order is fixed: **Greptile check → Aider draft → Qodo test → Claude Code wire → Claude lock-review → Charan pushes.**

---

## 📋 THE PART1 / PART2 SYSTEM

For every task (module, or a sub-piece of a module), two files live together in
`docs/task-assignments/M<XX>-<module-name>/<task-name>/`:

- **PART1_TASK.md** — written by Claude (or Charan). States exactly what must be built: file list, contract (OWN/USE/PROVIDE/DATABASE/FORBIDDEN), and acceptance criteria. Whichever AI is assigned reads ONLY this to know what to do.
- **PART2_STATUS.md** — written by whichever AI worked the task. States: done / blocked / problem found, what was tested, what's still open. Next AI in the chain reads this before starting their stage.

**Rule: nobody skips writing PART2 before handing off.** If PART2 is empty or missing, the next AI must stop and flag it rather than proceed blind.

Templates: `docs/task-assignments/TEMPLATE_PART1_TASK.md` and `TEMPLATE_PART2_STATUS.md`.

---

## 📁 WHERE THINGS LIVE (per existing Repository Structure doc)

```
GNT/
├── AI_TEAM_CHARTER.md          ← this file
├── docs/
│   ├── roadmap/                 ← existing: master wiring map, ABCD map, file-function mapping
│   └── task-assignments/        ← new: PART1/PART2 per task
│       ├── TEMPLATE_PART1_TASK.md
│       ├── TEMPLATE_PART2_STATUS.md
│       └── M<XX>-<module-name>/<task-name>/PART1_TASK.md, PART2_STATUS.md
├── frontend/src/modules/M01-M20/
├── backend/src/modules/M01-M20/
├── api-contracts/
├── database/
└── tests/
```

*Every AI tool's own config file (`.aider.conf.yml`, `.cursorrules`, `.continuerules`, `CLAUDE.md`) should point back to this charter and to `docs/roadmap/`.*
