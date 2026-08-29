# GNT (Garuda Nextech) Billing Project

## IMPORTANT FOR AI/DEVELOPERS

> **Before writing any code or adding files, you MUST consult the blueprint files in `docs/roadmap/` and strictly follow the Public API boundary rules and module mapping.**

### Non-negotiable architecture rules

1. Every implementation file has exactly one owning module.
2. Cross-module communication is allowed only through a registered **PUBLIC Service / PUBLIC API / EVENT**.
3. Direct calls to another module's private service, internal file, repository, or database table are forbidden.
4. Database ownership remains with the owning module; cross-module database writes are forbidden.
5. Do not silently invent files. Files required by a declared count but not explicitly named in the source must be registered as `DESIGN-EXPANSION / NEEDS APPROVAL`.
6. A module is complete only after its Frontend + Backend + API + Database + Tests + Repository Map + Dependency Map + Wiring Map + Test Map are complete and verified.

### Module classes

- **Class A:** M01–M05
- **Class B:** M06–M10
- **Class C:** M11–M15
- **Class D:** M16–M20

### Repository layout

- `frontend/src/modules/<Mxx-module-name>/`
- `backend/src/modules/<Mxx-module-name>/`
- `api-contracts/v1/`
- `wiring-maps/module-wiring/`
- `wiring-maps/cross-module-flows/`
- `wiring-maps/event-registry/`
- `database/schema/`
- `database/migrations/`
- `database/seeders/`
- `database/views/`
- `tests/`
- `docs/roadmap/`

### Golden runtime call chain

`Frontend Page → Validator → Frontend Service → Common API Client → Route → Middleware → Controller → PUBLIC Service → Owner Repository → Database → Events → Audit → Response → Store/UI`

### Source-of-truth warning

The supplied Advanced Software Blueprint declares **914 system files** (312 frontend, 285 backend, 76 API/wiring, 42 database, 156 tests, plus 43 blueprint documents). Therefore this repository scaffold is a **directory/placement scaffold**, not a claim that 1500+ implementation files have been created.

See `docs/STRUCTURE.md` for the generated directory plan.
