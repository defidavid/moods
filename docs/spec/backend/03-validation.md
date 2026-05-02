# Backend — 03 Validation

## Purpose

Centralize every request-shape check in one zod module. The error handler plugin (see `04-error-handling.md`) maps thrown `ZodError`s to the canonical `400 VALIDATION_ERROR` envelope. Routes never validate by hand; they call `Schema.parse(...)`.

## Files to create

- `backend/src/validation.ts`

## ACs owned

- **AC-28** — `intensity: 0` (or any non-1..5 integer) rejected with `VALIDATION_ERROR` and a field-naming message.
- **AC-29** — unknown `emotionId` rejected with message `unknown emotionId: <id>`.
- **AC-30** — `note` longer than 500 chars rejected with `VALIDATION_ERROR`.

## Design notes

- The emotion id list is duplicated here as a `z.enum([...])` literal so unknown ids fail at parse time and the error envelope can name the field. Keeping it as a `z.enum` (not `z.string().refine`) gives zod's discriminated error message for free. The single source of truth is `spec/02-emotion-taxonomy.md`; this enum and `backend/src/emotions.ts` (see `07-route-emotions.md`) must match it byte-for-byte.
- `LoginBody` accepts an empty body. We still parse it to keep the route shape symmetric (and to reject obviously hostile `null`/array bodies).
- `EntryCreateBody.note` is `string | null | undefined` in input; the route normalizes `""` and `undefined` to `null` (see `08-route-entries.md`, AC-35).
- `EntryParams` validates the `:id` route param as a UUID. A non-UUID id yields a 400 (validation), not a 404 — distinct from "valid UUID, not in store" which is 404 (AC-33).

## `backend/src/validation.ts` (canonical)

```ts
import { z } from "zod";

/** The 16 canonical emotion ids. Mirrors spec/02-emotion-taxonomy.md. */
export const EMOTION_IDS = [
  "energetic", "excited", "joyful", "proud",
  "calm", "content", "grateful", "relaxed",
  "angry", "anxious", "frustrated", "stressed",
  "sad", "tired", "lonely", "bored",
] as const;

export type EmotionId = (typeof EMOTION_IDS)[number];

/** POST /login — body is ignored but must parse. */
export const LoginBody = z.object({}).passthrough();
export type LoginBodyT = z.infer<typeof LoginBody>;

/**
 * POST /entries — request body.
 * - emotionId: must be in the canonical taxonomy
 * - intensity: integer 1..5
 * - note: optional; "", null, or omitted are all accepted; route normalizes to null
 */
export const EntryCreateBody = z.object({
  emotionId: z.enum(EMOTION_IDS, {
    errorMap: (_issue, ctx) => ({
      message: `unknown emotionId: ${String(ctx.data)}`,
    }),
  }),
  intensity: z
    .number({ invalid_type_error: "intensity must be an integer between 1 and 5" })
    .int("intensity must be an integer between 1 and 5")
    .min(1, "intensity must be an integer between 1 and 5")
    .max(5, "intensity must be an integer between 1 and 5"),
  note: z
    .union([z.string().max(500, "note must be 500 characters or fewer"), z.null()])
    .optional(),
});
export type EntryCreateBodyT = z.infer<typeof EntryCreateBody>;

/** DELETE /entries/:id — path params. */
export const EntryParams = z.object({
  id: z.string().uuid("id must be a UUID"),
});
export type EntryParamsT = z.infer<typeof EntryParams>;
```

## Usage examples

In a route handler:

```ts
const body = EntryCreateBody.parse(req.body);
// body.emotionId: EmotionId
// body.intensity: number (1..5)
// body.note: string | null | undefined
```

If `req.body.intensity === 0`, `parse` throws a `ZodError` whose first issue message is `"intensity must be an integer between 1 and 5"`. The error-handler plugin formats:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "intensity must be an integer between 1 and 5" } }
```

If `req.body.emotionId === "nonsense"`, the same path produces:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "unknown emotionId: nonsense" } }
```

Note that `ctx.data` in the `errorMap` is the offending value, satisfying the canonical message in AC-29.

## Verification

`npx tsc --noEmit` over the file passes. Inferred types (`EntryCreateBodyT`, etc.) appear in IDE hover. Route files import only the schemas and inferred types from this module — no ad-hoc validation elsewhere.
