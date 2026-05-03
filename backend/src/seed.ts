import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// Resolve paths lazily on every call: tests swap process.env.DB_PATH between
// cases and need the current value, not whatever was set at module load.
function resolveDbPath(): string {
  return resolve(process.cwd(), process.env.DB_PATH ?? "./db.json");
}
function resolveSeedPath(): string {
  return resolve(process.cwd(), "./db.seed.json");
}

/**
 * If db.json is missing, copy db.seed.json into place.
 * Idempotent: safe to call on every boot.
 *
 * Owns AC-25.
 */
export function seedIfMissing(): void {
  const dbPath = resolveDbPath();
  const seedPath = resolveSeedPath();
  if (existsSync(dbPath)) return;
  if (!existsSync(seedPath)) {
    throw new Error(`seed file missing: ${seedPath}`);
  }
  copyFileSync(seedPath, dbPath);
}

// Allow running as a CLI: `npm run seed` forces a (re)seed.
// In CLI mode, overwrite db.json unconditionally.
if (import.meta.url === `file://${process.argv[1]}`) {
  const dbPath = resolveDbPath();
  const seedPath = resolveSeedPath();
  copyFileSync(seedPath, dbPath);
  // eslint-disable-next-line no-console
  console.log(`seeded ${dbPath} from ${seedPath}`);
}
