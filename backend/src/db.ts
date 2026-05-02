import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { MoodEntry } from "./types.js";

/**
 * Resolve the on-disk DB path lazily on every IO call.
 *
 * Tests swap `process.env.DB_PATH` between cases (per-test temp files); freezing
 * this value at module load would defeat per-test isolation and break
 * AC-24 / AC-25 / AC-26 / AC-27.
 */
function resolveDbPath(): string {
  return resolve(process.cwd(), process.env.DB_PATH ?? "./db.json");
}

interface DbShape {
  version: 1;
  entries: MoodEntry[];
}

/** Module-private state. Routes never touch this directly. */
const state = {
  entries: new Map<string, MoodEntry>(),
  loaded: false,
};

/** Synchronous load at boot. Throws if the file exists but is malformed. */
export function loadDb(): void {
  const path = resolveDbPath();
  if (!existsSync(path)) {
    state.entries = new Map();
    state.loaded = true;
    return;
  }
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as DbShape;
  if (parsed.version !== 1) {
    throw new Error(`db.json: unsupported version ${parsed.version}`);
  }
  state.entries = new Map(parsed.entries.map((e) => [e.id, e]));
  state.loaded = true;
}

/** Atomic write. Caller invokes after every mutation. */
export function persist(): void {
  if (!state.loaded) {
    throw new Error("persist() called before loadDb()");
  }
  const snapshot: DbShape = {
    version: 1,
    entries: Array.from(state.entries.values()),
  };
  const path = resolveDbPath();
  const tmp = `${path}.tmp`;
  writeFileSync(tmp, JSON.stringify(snapshot, null, 2), "utf8");
  renameSync(tmp, path);
}

/** Internal accessor for the store layer. Do not import elsewhere. */
export function _entriesMap(): Map<string, MoodEntry> {
  if (!state.loaded) {
    throw new Error("_entriesMap() called before loadDb()");
  }
  return state.entries;
}

export function _dbPath(): string {
  return resolveDbPath();
}
