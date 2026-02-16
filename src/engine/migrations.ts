import type { GraphData } from './types';

/**
 * Current schema version. Increment when making breaking changes to GraphData.
 */
export const CURRENT_VERSION = 1;

/**
 * Migration function type: takes data at version N, returns data at version N+1.
 */
type OldGraphData = any; // Use 'any' for old data shape since it may differ from current GraphData
type Migration = (data: OldGraphData) => GraphData;

/**
 * Migration registry. Each key is the version BEFORE the migration.
 * Example: migrations[0] upgrades v0 data to v1.
 */
const migrations: Record<number, Migration> = {
  // v0 → v1: Add tags field to nodes (legacy data from before versioning)
  0: (data) => {
    return {
      ...data,
      nodes: data.nodes.map((n: any) => ({
        ...n,
        tags: n.tags ?? [],
      })),
    };
  },
};

/**
 * Run all migrations from `fromVersion` to `CURRENT_VERSION`.
 * Returns migrated data or undefined if migration fails.
 */
export function runMigrations(data: OldGraphData, fromVersion: number): GraphData | undefined {
  if (fromVersion > CURRENT_VERSION) {
    // Future version — can't migrate backwards
    console.warn(
      `Data is from version ${fromVersion}, but current version is ${CURRENT_VERSION}. Cannot migrate.`,
    );
    return undefined;
  }

  if (fromVersion === CURRENT_VERSION) {
    // Already current
    return data;
  }

  // Run migrations sequentially: v1→v2→v3→...→current
  let migrated = data;
  for (let v = fromVersion; v < CURRENT_VERSION; v++) {
    const migration = migrations[v];
    if (!migration) {
      console.warn(`Missing migration from v${v} to v${v + 1}`);
      return undefined;
    }
    try {
      migrated = migration(migrated);
    } catch (error) {
      console.error(`Migration v${v}→v${v + 1} failed:`, error);
      return undefined;
    }
  }

  return migrated;
}
