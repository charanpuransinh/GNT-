/**
 * M24 — adapters/real-schema-adapter.ts
 * WIRED (2026-09-12): verified the real repo's migration process (project
 * memory) — raw SQL files in `database/migrations/NNN_*.sql`, applied
 * manually with psql, no Prisma Migrate. `listIndexes` does real,
 * read-only introspection against Postgres (`pg_indexes`). `proposeIndex`
 * NEVER issues DDL itself — consistent with the original design ("Wiring
 * Only After Testing") — it only returns the next free migration file
 * number for a human to write and apply, matching the real numbering
 * already in use (currently up to 020_M23_security_policy_retention.sql).
 */

import { prisma } from '@/common/config/prisma';
import type { IndexDefinition, SchemaAdapter } from '../database/index-manager';

interface PgIndexRow {
  indexname: string;
  indexdef: string;
}

function columnsFromIndexDef(indexdef: string): string[] {
  const match = indexdef.match(/\(([^)]+)\)/);
  if (!match) return [];
  return match[1].split(',').map((c) => c.trim());
}

export class RealSchemaAdapter implements SchemaAdapter {
  async listIndexes(table: string): Promise<IndexDefinition[]> {
    const rows = await prisma.$queryRaw<PgIndexRow[]>`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = ${table}
    `;
    return rows.map((r) => ({
      table,
      name: r.indexname,
      columns: columnsFromIndexDef(r.indexdef),
      unique: r.indexdef.toUpperCase().includes('UNIQUE'),
    }));
  }

  /**
   * Never applies DDL. Returns a suggested next migration filename for a
   * human to review and create — the real migration pipeline in this repo
   * is manual SQL + psql, not an auto-apply tool.
   */
  async proposeIndex(definition: IndexDefinition): Promise<{ migrationRef: string }> {
    const slug = `${definition.table}_${definition.columns.join('_')}`;
    return { migrationRef: `database/migrations/NNN_${slug}_index.sql (owner must assign NNN + review)` };
  }
}

export const realSchemaAdapter = new RealSchemaAdapter();
