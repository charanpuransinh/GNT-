# GARUDA NEXTECH (GNT) — MASTER DOT-TO-DOT WIRING MAP
Version: 2.0 | Mapping Layer: L1 MASTER

## AUTHORITY
This document is a mapping layer over the GNT Advanced Software Blueprint V2. It does not replace the Master Blueprint.
Unknown/unlisted implementation files are NOT invented; they are marked DESIGN-EXPANSION / NEEDS APPROVAL.

## MASTER HIERARCHY

GNT
│
├── CLASS A — M01–M05
│   ├── M01 Foundation
│   ├── M02 Core Architecture
│   ├── M03 Device & Platform
│   ├── M04 Company Management
│   └── M05 Party Management
│
├── CLASS B — M06–M10
│   ├── M06 Inventory
│   ├── M07 Purchase
│   ├── M08 Sales & Billing
│   ├── M09 GST & Compliance
│   └── M10 Accounting
│
├── CLASS C — M11–M15
│   ├── M11 Payment & Communication
│   ├── M12 Employee & HR
│   ├── M13 Smart Automation
│   ├── M14 Generic Data Import/Export
│   └── M15 Data Storage & Sync
│
└── CLASS D — M16–M20
    ├── M16 Notification Engine
    ├── M17 Reporting
    ├── M18 External Integration
    ├── M19 Production & Monitoring
    └── M20 International Trade & 8-Digit HSN

## MASTER MODULE ROAD

M01 → M02 → M03 → M04 → M05
                  ↓
M05 → M06 → M07 → M08 → M09 → M10 → M11
       │      │      │
       └→ M13 ┘      │
M12 ────────────────→ M10 (controlled contract where applicable)
M14 = generic import/export
M15 → ALL MODULES (offline/sync contract only)
M16 ← registered notification producers
M17 ← reporting data/contracts from transactional modules
M18 → external systems
M19 ← audit/security/health events
M20 ↔ approved modules + M18 through public contracts

## GLOBAL CALL CHAIN

USER
 ↓
Frontend Page
 ↓
Module Frontend Service
 ↓
Common API Client
 ↓
Module Route
 ↓
Security / Tenant / Validation Middleware
 ↓
Controller
 ↓
PUBLIC Module Service
 ↓
PUBLIC Cross-Module Service/API/Event (when required)
 ↓
Owner Repository
 ↓
Owner Database
 ↓
Event Bus
 ↓
Registered Event Handler
 ↓
Audit Logger
 ↓
API Response
 ↓
Frontend Store
 ↓
UI

## HARD BOUNDARY

LEGAL:
Module A → PUBLIC Service / PUBLIC API / EVENT → Module B

FORBIDDEN:
Module A → Module B private service
Module A → Module B internal file
Module A → Module B repository
Module A → Module B database table directly

## FILE PLACEMENT

frontend/src/modules/<module>/
backend/src/modules/<module>/
api-contracts/v1/
wiring-maps/module-wiring/
wiring-maps/cross-module-flows/
wiring-maps/event-registry/
database/schema/
database/migrations/
database/seeders/
database/views/
tests/

## DIAGNOSTIC ROAD

GNT
 ↓
CLASS
 ↓
MODULE
 ↓
FILE
 ↓
FUNCTION / METHOD
 ↓
DEPENDENCY
 ↓
INPUT
 ↓
OUTPUT
 ↓
ERROR
 ↓
ROOT CAUSE
 ↓
AFFECTED CALLERS
 ↓
TEST THAT MUST FAIL/PASS

## RUNTIME ROAD

Repository
 ↓
Config
 ↓
Environment / Dependencies
 ↓
Startup
 ↓
Entry Point
 ↓
App Shell
 ↓
Routes
 ↓
Module Wiring
 ↓
Service Calls
 ↓
Database / External Boundary
 ↓
Events
 ↓
Tests
 ↓
Build
 ↓
Deployment
 ↓
Runtime Health

## LOCK PRINCIPLE

A module is complete only after its own Frontend + Backend + API + Database + Tests + Repository Map + Dependency Map + Wiring Map + Test Map are complete and verified.
