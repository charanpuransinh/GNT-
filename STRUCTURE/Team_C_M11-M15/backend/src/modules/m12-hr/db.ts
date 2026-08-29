// M12 HR Module - Shared Prisma Client
// WIRING FIX (2026-08-28): each service file previously did its own `new PrismaClient()`
// (5 separate instances across attendance/department/employee/leave/payroll services).
// In a modular monolith this exhausts the DB connection pool as more modules load —
// every module should share one client. This file provides that single instance;
// each service now imports `prisma` from here instead of constructing its own.
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
