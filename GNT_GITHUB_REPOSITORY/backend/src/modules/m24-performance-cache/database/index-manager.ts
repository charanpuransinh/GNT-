/**
 * M24 — database/index-manager.ts
 * OWN: Inspect/manage APPROVED database indexes.
 *
 * VERIFICATION NEEDED: actual migration tooling (Prisma migrate, per project
 * memory). This service never issues raw DDL directly — it depends on an
 * injected SchemaAdapter so index changes always go through the project's
 * real, reviewed migration process (Database Contract, Section 23).
 */

export interface IndexDefinition {
  table: string;
  columns: string[];
  unique?: boolean;
  name?: string;
}

export interface SchemaAdapter {
  listIndexes(table: string): Promise<IndexDefinition[]>;
  /** Must route through the project's real migration process — never raw DDL from here. */
  proposeIndex(definition: IndexDefinition): Promise<{ migrationRef: string }>;
}

export class IndexManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IndexManagerError';
  }
}

export class IndexManager {
  constructor(private readonly adapter: SchemaAdapter) {}

  async listIndexes(table: string): Promise<IndexDefinition[]> {
    if (!table) throw new IndexManagerError('table is required');
    return this.adapter.listIndexes(table);
  }

  /**
   * Never applies a schema change directly. Returns a migration reference
   * that a human (or the project's approved migration pipeline) must review
   * and apply — consistent with "Wiring Only After Testing" (Rule 20).
   */
  async proposeIndex(definition: IndexDefinition): Promise<{ migrationRef: string }> {
    const existing = await this.adapter.listIndexes(definition.table);
    const alreadyExists = existing.some(
      (idx) => JSON.stringify(idx.columns) === JSON.stringify(definition.columns),
    );
    if (alreadyExists) {
      throw new IndexManagerError(`Index on ${definition.table}(${definition.columns.join(',')}) already exists`);
    }
    return this.adapter.proposeIndex(definition);
  }
}

// WIRED (2026-09-12): default instance backed by real Postgres introspection
// (adapters/real-schema-adapter.ts) — read-only, never issues DDL itself.
import { realSchemaAdapter } from '../adapters/real-schema-adapter';
export const indexManager = new IndexManager(realSchemaAdapter);
