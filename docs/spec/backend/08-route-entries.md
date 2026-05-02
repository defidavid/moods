# Backend — 08 Route: /entries

## Purpose

The three entry-CRUD routes. All auth-protected. All bodies validated by zod (`03-validation.md`). All persistence delegated to the store (`02-data-store.md`).

- `GET /entries` — list all entries for `u1`, sorted desc by `loggedAt`.
- `POST /entries` — create one. Server assigns `id`, `userId`, `loggedAt`.
- `DELETE /entries/:id` — hard delete. 404 if missing.

## Files to create

- `backend/src/routes/entries.ts`

## ACs owned

- **AC-33** — DELETE on non-existent id → 404 (the store throws `NotFoundError`; the error handler converts).
- **AC-35** — `POST /entries` with `note: ""` persists `note: null`.
- **AC-36** — client-supplied `id` / `userId` / `loggedAt` are ignored; server-assigned values win.

(AC-37 — sort desc — is owned by the store. The route just calls `listEntries()`.)

## Response shapes (recap from `spec/04-api-contract.md`)

```ts
// GET /entries
{ entries: MoodEntry[] }     // 200

// POST /entries
{ entry: MoodEntry }         // 201

// DELETE /entries/:id
{ ok: true }                 // 200
```

Every response is an object with one named key. Never bare arrays or bare booleans.

## Note normalization

The validation schema accepts `note: string | null | undefined`. The route normalizes:

| Input             | Stored      |
|-------------------|-------------|
| omitted           | `null`      |
| `null`            | `null`      |
| `""`              | `null`      |
| `"hello"`         | `"hello"`   |
| 501-char string   | rejected by zod (400) |

This satisfies AC-35 and the data-contract invariant in `spec/01-data-contracts.md`.

## Ignoring client-supplied server fields

Even though the schema does not declare `id` / `userId` / `loggedAt`, zod (without `.strict()`) silently passes extra keys through. The route MUST NOT read them. Pass only the validated fields into `addEntry`. The store unconditionally assigns `id` (uuid), `userId` (`"u1"`), and `loggedAt` (`new Date().toISOString()`). AC-36.

## `backend/src/routes/entries.ts` (canonical)

```ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { EntryCreateBody, EntryParams } from "../validation.js";
import { addEntry, listEntries, removeEntry } from "../store/entries.js";

export async function entryRoutes(app: FastifyInstance): Promise<void> {
  // GET /entries — list, sorted desc by loggedAt (AC-37, owned by store).
  app.get(
    "/entries",
    { config: { protected: true } },
    async () => ({ entries: listEntries() })
  );

  // POST /entries — create, server assigns id/userId/loggedAt (AC-36).
  app.post(
    "/entries",
    { config: { protected: true } },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = EntryCreateBody.parse(req.body);

      // Normalize empty-string and undefined to null (AC-35).
      const note =
        body.note === undefined || body.note === "" ? null : body.note;

      const entry = addEntry({
        emotionId: body.emotionId,
        intensity: body.intensity as 1 | 2 | 3 | 4 | 5,
        note,
      });

      reply.status(201);
      return { entry };
    }
  );

  // DELETE /entries/:id — hard delete; 404 if absent (AC-33, via NotFoundError).
  app.delete(
    "/entries/:id",
    { config: { protected: true } },
    async (req: FastifyRequest) => {
      const { id } = EntryParams.parse(req.params);
      removeEntry(id); // throws NotFoundError → 404 via error handler
      return { ok: true };
    }
  );
}
```

Notes:
- The intensity cast (`as 1|2|3|4|5`) is safe: zod has already enforced integer in 1..5. TypeScript can't narrow a `number` to a literal union, so the cast is the cheapest way to satisfy `EntryCreateInput`.
- Do not catch `NotFoundError` inside the route. Let it bubble to the error handler, which translates to 404 with the canonical envelope.
- Do not `try/catch` `ZodError` either. Same reason.

## Wiring

In `server.ts`:

```ts
import { entryRoutes } from "./routes/entries.js";

await app.register(entryRoutes);
```

## Verification (manual)

```bash
TOKEN='Bearer demo-token'

# Create
curl -s -X POST http://localhost:3000/entries \
  -H "Authorization: $TOKEN" -H 'Content-Type: application/json' \
  -d '{"emotionId":"calm","intensity":2,"note":""}' | jq

# Confirm note normalized to null:
#   { "entry": { ..., "note": null, "loggedAt": "...", "id": "...", "userId": "u1" } }

# List
curl -s http://localhost:3000/entries -H "Authorization: $TOKEN" | jq '.entries | length'

# Delete (replace with returned id)
curl -s -X DELETE http://localhost:3000/entries/<id> -H "Authorization: $TOKEN" | jq
# → { "ok": true }

# Delete again → 404
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE \
  http://localhost:3000/entries/00000000-0000-4000-8000-000000000000 \
  -H "Authorization: $TOKEN"
# → 404
```

Negative paths (covered exhaustively in `10-tests.md`):
- `intensity: 0` → 400 `VALIDATION_ERROR` (AC-28)
- `emotionId: "nonsense"` → 400 with `unknown emotionId: nonsense` (AC-29)
- `note` of 501 chars → 400 (AC-30)
- Client passes `id`, `userId`, `loggedAt` → ignored; server values returned (AC-36)
