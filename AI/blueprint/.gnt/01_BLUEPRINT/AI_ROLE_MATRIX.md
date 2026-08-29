# AI_ROLE_MATRIX.md

| Tool | Role | Trigger | Setup needed |
|---|---|---|---|
| Claude (chat) | Head of Department — architecture, final review, unlocking modules | You ask, in chat | None — already working |
| Aider | Primary fixer — bulk edits, targeted fixes | Automatic via GitHub Actions on push (see workflow), OR manual in Termux | ANTHROPIC_API_KEY as a GitHub Actions secret |
| Claude Code | Deep/complex wiring, hard debugging | Manual — you run it in Termux when needed | Node.js + `npm install -g @anthropic-ai/claude-code` |
| CodeQL | Security gate | Automatic — GitHub Settings → Security | One-time: enable in repo Settings → Code security |
| Dependabot | Dependency gate | Automatic | One-time: enable in repo Settings → Security |
| CodeRabbit | PR review | Automatic on every PR | One-time: Configure via GitHub Marketplace |
| Greptile | Codebase search/review | Manual, or automatic if configured as a GitHub App | One-time: greptile.com → connect repo |
| Qodo | Test writing / PR review | Manual or Marketplace app | Optional — no permanent free tier |
| GitHub Actions | Orchestrator/dispatcher | Automatic — runs the workflow file below | Already included in this package |

## Fixed pipeline order
`Greptile/scan -> Aider fix -> tests -> CodeQL/security -> Dependabot -> wiring check -> Claude final review -> LOCKED`

If a tool is unavailable, its replacement (per the original blueprint):
Aider unavailable -> Claude Code or Cline
Greptile unavailable -> local grep/search + CodeQL
Cloud model unavailable -> note it in task file, escalate to Claude chat
