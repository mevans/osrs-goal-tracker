import type { GraphData } from './types';

/**
 * Current schema version. Increment when making breaking changes to GraphData.
 */
export const CURRENT_VERSION = 1;

/**
 * Raw data shape from unknown (possibly old) saves. Typed as a loose record
 * rather than `any` so property access still requires explicit handling.
 */
type RawData = Record<string, unknown>;
type Migration = (data: RawData) => RawData;

/**
 * Migration registry. Each key is the version BEFORE the migration.
 * Example: migrations[1] upgrades v1 data to v2.
 */
const migrations: Record<number, Migration> = {
  // future migrations go here
};

/**
 * Run all migrations from `fromVersion` to `CURRENT_VERSION`.
 * Returns migrated data or undefined if migration fails.
 */
export function runMigrations(data: unknown, fromVersion: number): GraphData | undefined {
  if (fromVersion > CURRENT_VERSION) {
    console.warn(
      `Data is from version ${fromVersion}, but current version is ${CURRENT_VERSION}. Cannot migrate.`,
    );
    return undefined;
  }

  if (fromVersion === CURRENT_VERSION) {
    return data as GraphData;
  }

  let migrated: RawData = data as RawData;
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

  return migrated as unknown as GraphData;
}
