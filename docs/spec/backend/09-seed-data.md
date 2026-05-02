# Backend — 09 Seed Data

## Purpose

On first boot, write a realistic-looking `db.json` so screenshots, manual QA, and the Insights chart all have something interesting to render. If `db.json` already exists, do nothing — never overwrite real data.

## Files to create

- `backend/db.seed.json` — the literal seed payload, committed to the repo.
- `backend/src/seed.ts` — `seedIfMissing()` function called from `server.ts` boot.

## ACs owned

- **AC-25** — server cold starts with `db.json` absent → seed runs and `db.json` is written before listening.

## Boot sequence (recap from `02-data-store.md`)

```ts
import { seedIfMissing } from "./seed.js";
import { loadDb } from "./db.js";

seedIfMissing();   // copies db.seed.json -> db.json if missing
loadDb();          // hydrates the in-memory map from db.json
await app.listen({ port, host: "0.0.0.0" });
```

`seedIfMissing` runs synchronously and returns before `loadDb`. There is no async window.

## Seed shape

The seed JSON is the same shape as `db.json`: `{ version: 1, entries: MoodEntry[] }`. 14 entries, spread across the past 7 days, varied across all four quadrants and the full intensity range. Notes are realistic and short — they appear in screenshots. `loggedAt` values are explicit ISO strings dated relative to `2026-05-02` (today's date in the foundation docs). When the seed is shipped, treat these timestamps as fixed; the goal is reproducible seed output, not "always the past 7 days from `now()`".

## `backend/db.seed.json` (canonical, committed)

```json
{
  "version": 1,
  "entries": [
    {
      "id": "11111111-1111-4111-8111-111111111101",
      "userId": "u1",
      "emotionId": "energetic",
      "intensity": 4,
      "note": "Coffee + sunshine.",
      "loggedAt": "2026-05-02T15:14:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111102",
      "userId": "u1",
      "emotionId": "anxious",
      "intensity": 3,
      "note": "Inbox spike before standup.",
      "loggedAt": "2026-05-02T11:42:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111103",
      "userId": "u1",
      "emotionId": "grateful",
      "intensity": 5,
      "note": "Long walk with the dog.",
      "loggedAt": "2026-05-01T22:05:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111104",
      "userId": "u1",
      "emotionId": "tired",
      "intensity": 4,
      "note": null,
      "loggedAt": "2026-05-01T18:30:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111105",
      "userId": "u1",
      "emotionId": "frustrated",
      "intensity": 3,
      "note": "Rebased six times.",
      "loggedAt": "2026-04-30T20:11:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111106",
      "userId": "u1",
      "emotionId": "joyful",
      "intensity": 4,
      "note": "Got the demo working.",
      "loggedAt": "2026-04-30T17:45:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111107",
      "userId": "u1",
      "emotionId": "calm",
      "intensity": 2,
      "note": "Quiet morning.",
      "loggedAt": "2026-04-29T13:20:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111108",
      "userId": "u1",
      "emotionId": "stressed",
      "intensity": 4,
      "note": "Two deadlines collided.",
      "loggedAt": "2026-04-29T19:55:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111109",
      "userId": "u1",
      "emotionId": "proud",
      "intensity": 5,
      "note": "Shipped the chart.",
      "loggedAt": "2026-04-28T23:00:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111110",
      "userId": "u1",
      "emotionId": "lonely",
      "intensity": 2,
      "note": null,
      "loggedAt": "2026-04-28T05:10:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111111",
      "userId": "u1",
      "emotionId": "excited",
      "intensity": 5,
      "note": "Trip booked!",
      "loggedAt": "2026-04-27T16:24:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111112",
      "userId": "u1",
      "emotionId": "bored",
      "intensity": 2,
      "note": "Long meeting.",
      "loggedAt": "2026-04-27T21:48:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111113",
      "userId": "u1",
      "emotionId": "content",
      "intensity": 3,
      "note": "Good food, good company.",
      "loggedAt": "2026-04-26T20:30:00.000Z"
    },
    {
      "id": "11111111-1111-4111-8111-111111111114",
      "userId": "u1",
      "emotionId": "angry",
      "intensity": 3,
      "note": "Got cut off in traffic.",
      "loggedAt": "2026-04-26T08:15:00.000Z"
    }
  ]
}
```

## `backend/src/seed.ts` (canonical)

```ts
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
```

Notes:
- `copyFileSync` is sufficient — the seed file is small and we want byte-exact persistence (the seed already matches the on-disk schema).
- The CLI mode at the bottom lets a developer `npm run seed` to reset their dev state without restarting the server. The boot path uses `seedIfMissing()` directly and never overwrites.

## Verification

```bash
cd backend
rm -f db.json
npm run dev
# observe: db.json appears with 14 entries
```

```bash
curl -s http://localhost:3000/entries -H 'Authorization: Bearer demo-token' | jq '.entries | length'
# → 14
```

The vitest suite (`10-tests.md`) covers the missing-file path with a temp directory.
