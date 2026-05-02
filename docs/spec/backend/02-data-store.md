# Backend — 02 Data Store

## Purpose

The only filesystem-touching code in the backend. Owns:
- Boot-time hydration from `db.json` into an in-memory `Map`.
- Atomic persistence after every mutation.
- The CRUD operations the routes call.

After this file, the rest of the backend treats persistence as solved.

## Files to create

- `backend/src/types.ts` — copy verbatim from `spec/01-data-contracts.md`.
- `backend/src/db.ts` — load + persist primitives.
- `backend/src/store/entries.ts` — CRUD over entries.
- `backend/src/errors.ts` — `NotFoundError` class used by the store.

## ACs owned

- **AC-24** — boot hydration before HTTP listen.
- **AC-26** — round-trip survives a restart.
- **AC-27** — atomic write: tmp + rename.
- **AC-37** — list returns entries sorted by `loggedAt` desc.

## On-disk schema

`db.json` is a single JSON object:

```json
{
  "version": 1,
  "entries": [
    {
      "id": "8f1c0d72-2b05-4a5e-9b3a-1f7d4f8e8c11",
      "userId": "u1",
      "emotionId": "energetic",
      "intensity": 4,
      "note": "Coffee + sunshine.",
      "loggedAt": "2026-05-02T18:14:00.000Z"
    }
  ]
}
```

`version` is a sentinel for future migration; in v0 it is always `1`. Loader rejects any other value.

## `backend/src/errors.ts` (canonical)

```ts
export class NotFoundError extends Error {
  constructor(message = "not found") {
    super(message);
    this.name = "NotFoundError";
  }
}
```

## `backend/src/db.ts` (canonical)

```ts
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
```

Notes:
- `loadDb` is synchronous because boot is synchronous: hydrate, then `app.listen()`. No race window where requests hit an unhydrated store.
- `persist` writes `${path}.tmp` then `renameSync` — POSIX rename is atomic on the same filesystem, satisfying AC-27.
- The `state.loaded` guard makes "forgot to call loadDb" loud instead of silently empty.
- `resolveDbPath()` is called fresh on every IO. The path is **not** captured at module load. Tests reset `process.env.DB_PATH` between cases (and across simulated restarts within a single test) without re-importing the module.

## `backend/src/store/entries.ts` (canonical)

```ts
import { v4 as uuidv4 } from "uuid";
import { _entriesMap, persist } from "../db.js";
import type { MoodEntry } from "../types.js";
import { NotFoundError } from "../errors.js";

export interface EntryCreateInput {
  emotionId: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  note: string | null;
}

/** All entries, sorted by loggedAt descending (newest first). AC-37. */
export function listEntries(): MoodEntry[] {
  const all = Array.from(_entriesMap().values());
  all.sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : a.loggedAt > b.loggedAt ? -1 : 0));
  return all;
}

/** Insert, persist, return the persisted entry. */
export function addEntry(input: EntryCreateInput): MoodEntry {
  const entry: MoodEntry = {
    id: uuidv4(),
    userId: "u1",
    emotionId: input.emotionId,
    intensity: input.intensity,
    note: input.note,
    loggedAt: new Date().toISOString(),
  };
  _entriesMap().set(entry.id, entry);
  persist();
  return entry;
}

/** Hard delete. Throws NotFoundError if absent. */
export function removeEntry(id: string): void {
  const map = _entriesMap();
  if (!map.has(id)) {
    throw new NotFoundError(`entry not found: ${id}`);
  }
  map.delete(id);
  persist();
}
```

Notes:
- `userId` is forced to `"u1"` here; routes must not pass through a client value (AC-36).
- `loggedAt` is computed here; routes must not pass through a client value (AC-36).
- `removeEntry` raises `NotFoundError`, which the error-handler plugin maps to 404 (AC-33).

## Boot sequence

In `server.ts` (out of scope for this file but quoted for clarity):

```ts
import { loadDb } from "./db.js";
import { seedIfMissing } from "./seed.js";

seedIfMissing();   // see 09-seed-data.md
loadDb();
// ...register plugins and routes...
await app.listen({ port, host: "0.0.0.0" });
```

`seedIfMissing` writes `db.json` from `db.seed.json` if `db.json` is absent, then `loadDb()` hydrates. Together this satisfies AC-24 and AC-25.
