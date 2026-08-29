# GNT M01–M20 Testing Plan

## Phase A — Local/Termux-style test
Run the Runtime Test Package first. Capture failures.

## Phase B — GitHub repository test
Push this repository structure. Run CI/build/tests in the GitHub environment.

## Phase C — Compare
Compare:
- install/dependency failures
- TypeScript/build failures
- database migration failures
- module-to-module API failures
- authentication/permission failures
- external integration failures
- frontend runtime failures

## Phase D — Repair
Every failure becomes a tracked repair item. Rebuild and rerun the affected test group,
then rerun the complete regression suite.
