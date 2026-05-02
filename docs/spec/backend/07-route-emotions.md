# Backend — 07 Route: GET /emotions

## Purpose

Serve the canonical 16-emotion taxonomy from `spec/02-emotion-taxonomy.md`. Mobile calls this on launch and falls back to its bundled copy if the call fails (AC-40). Auth required.

## Files to create

- `backend/src/emotions.ts` — shared constant, exported for the route and for `seed.ts`.
- `backend/src/routes/emotions.ts` — the route module.

## ACs owned

None directly. This route satisfies the contract specified in `spec/04-api-contract.md` (`GET /emotions` returns 16 items).

## Source of truth

`spec/02-emotion-taxonomy.md` is the single source of truth. The constant below is a verbatim copy of that list. If the taxonomy changes, this file and `lib/emotions.ts` (mobile) must be updated together — see "Extending the list" in the taxonomy doc.

## `backend/src/emotions.ts` (canonical)

```ts
import type { Emotion } from "./types.js";

export const EMOTIONS: readonly Emotion[] = [
  { id: "energetic",  label: "Energetic",  quadrant: "yellow" },
  { id: "excited",    label: "Excited",    quadrant: "yellow" },
  { id: "joyful",     label: "Joyful",     quadrant: "yellow" },
  { id: "proud",      label: "Proud",      quadrant: "yellow" },

  { id: "calm",       label: "Calm",       quadrant: "green"  },
  { id: "content",    label: "Content",    quadrant: "green"  },
  { id: "grateful",   label: "Grateful",   quadrant: "green"  },
  { id: "relaxed",    label: "Relaxed",    quadrant: "green"  },

  { id: "angry",      label: "Angry",      quadrant: "red"    },
  { id: "anxious",    label: "Anxious",    quadrant: "red"    },
  { id: "frustrated", label: "Frustrated", quadrant: "red"    },
  { id: "stressed",   label: "Stressed",   quadrant: "red"    },

  { id: "sad",        label: "Sad",        quadrant: "blue"   },
  { id: "tired",      label: "Tired",      quadrant: "blue"   },
  { id: "lonely",     label: "Lonely",     quadrant: "blue"   },
  { id: "bored",      label: "Bored",      quadrant: "blue"   },
];
```

Length is 16. Quadrant distribution is 4/4/4/4 (yellow/green/red/blue). The order shown is the order returned over the wire — clients may rely on iteration order for deterministic UI rendering.

## `backend/src/routes/emotions.ts` (canonical)

```ts
import type { FastifyInstance } from "fastify";
import { EMOTIONS } from "../emotions.js";

export async function emotionRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/emotions",
    { config: { protected: true } },
    async () => ({ emotions: EMOTIONS })
  );
}
```

The response shape is `{ emotions: Emotion[] }`, matching `spec/04-api-contract.md` byte-for-byte. Do not return a bare array.

## Wiring

In `server.ts`:

```ts
import { emotionRoutes } from "./routes/emotions.js";

await app.register(emotionRoutes);
```

## Verification (manual)

```bash
curl -s http://localhost:3000/emotions -H 'Authorization: Bearer demo-token' | jq '.emotions | length'
```

Expected: `16`.

```bash
curl -s http://localhost:3000/emotions -H 'Authorization: Bearer demo-token' | jq '.emotions[0]'
```

Expected:

```json
{ "id": "energetic", "label": "Energetic", "quadrant": "yellow" }
```

Without the `Authorization` header, the same call returns 401 with the auth envelope (covered by AC-31 in the auth middleware tests).

## Consistency check

The `EMOTION_IDS` `z.enum` in `backend/src/validation.ts` (`03-validation.md`) and the `EMOTIONS` array here must contain the same 16 ids in the same order. A test in `10-tests.md` asserts `EMOTIONS.map(e => e.id) === EMOTION_IDS`.
