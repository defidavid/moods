import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DB_PATH = resolve(process.cwd(), process.env.DB_PATH ?? "./db.json");
const SEED_PATH = resolve(process.cwd(), "./db.seed.json");

/**
 * If db.json is missing, copy db.seed.json into place.
 * Idempotent: safe to call on every boot.
 *
 * Owns AC-25.
 */
export function seedIfMissing(): void {
  if (existsSync(DB_PATH)) return;
  if (!existsSync(SEED_PATH)) {
    throw new Error(`seed file missing: ${SEED_PATH}`);
  }
  copyFileSync(SEED_PATH, DB_PATH);
}

// Allow running as a CLI: `npm run seed` forces a (re)seed.
// In CLI mode, overwrite db.json unconditionally.
if (import.meta.url === `file://${process.argv[1]}`) {
  copyFileSync(SEED_PATH, DB_PATH);
  // eslint-disable-next-line no-console
  console.log(`seeded ${DB_PATH} from ${SEED_PATH}`);
}
