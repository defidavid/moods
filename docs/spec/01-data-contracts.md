# 01 — Data Contracts

The single source of truth for every shape that crosses the wire or is persisted. Mobile and backend both consume these definitions. When this file changes, both projects must update simultaneously.

## Location

- **Mobile:** `lib/types.ts` — copy verbatim.
- **Backend:** `backend/src/types.ts` — copy verbatim. Backend additionally re-exports the inferred types from its zod schemas in `backend/src/validation.ts`.

## Canonical TypeScript

```ts
// lib/types.ts (mobile)
// backend/src/types.ts (backend) — same content

/** The four quadrants of the mood grid. */
export type Quadrant = "yellow" | "green" | "red" | "blue";

/** A single emotion in the canonical taxonomy. */
export interface Emotion {
  /** Stable kebab-case slug. Never display this — display `label`. */
  id: string;
  /** Human-readable name shown in the UI. */
  label: string;
  /** Which quadrant this emotion belongs to. */
  quadrant: Quadrant;
}

/** A logged mood entry. */
export interface MoodEntry {
  /** Server-assigned UUID v4. */
  id: string;
  /** Owner user ID. Always "u1" in v0. */
  userId: string;
  /** References Emotion.id from the canonical taxonomy. */
  emotionId: string;
  /** Subjective intensity, 1 (mildest) through 5 (strongest). */
  intensity: 1 | 2 | 3 | 4 | 5;
  /** Optional free-text note, up to 500 chars. `null` when omitted. */
  note: string | null;
  /** ISO 8601 UTC timestamp, server-assigned at creation. */
  loggedAt: string;
}

/** Authenticated user (single hardcoded user in v0). */
export interface User {
  /** Always "u1". */
  id: string;
  /** Display name shown in the app shell. Always "You". */
  displayName: string;
}

/** Successful response from POST /login. */
export interface LoginResponse {
  /** Bearer token; in v0 this is always the literal string "demo-token". */
  token: string;
  user: User;
}

/** Standard error envelope. Returned with any non-2xx status. */
export interface ApiError {
  error: {
    /** Machine-readable code; clients switch on this. */
    code: ErrorCode;
    /** Human-readable message; safe to surface in the UI. */
    message: string;
  };
}

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";
```

## Field-level invariants

- `Emotion.id` is **stable**. Renaming an id is a breaking change; entries reference it.
- `MoodEntry.id` is generated server-side. Clients never invent it.
- `MoodEntry.loggedAt` is generated server-side at write time (`new Date().toISOString()`). Clients never send it.
- `MoodEntry.note` of `""` (empty string) must be normalized to `null` by the backend before persistence.
- `intensity` outside 1–5 (inclusive integers) is a 400 error.
- `userId` is always `"u1"`. The backend ignores any client-supplied value and forces `"u1"`.

## Sample payloads (illustrative, not seed data)

```json
{
  "id": "8f1c0d72-2b05-4a5e-9b3a-1f7d4f8e8c11",
  "userId": "u1",
  "emotionId": "energetic",
  "intensity": 4,
  "note": "Coffee + sunshine.",
  "loggedAt": "2026-05-02T18:14:00.000Z"
}
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "intensity must be an integer between 1 and 5"
  }
}
```

## Forbidden fields

The following are deliberately excluded. Do not add them.

- `tags`, `contextTags`, `categories`
- `photoUri`, `attachments`
- `mood` (we use `emotionId` + intensity)
- `createdAt`, `updatedAt` (use `loggedAt`)
- `deletedAt` (deletes are hard, not soft)
- `device`, `deviceId`, `clientId`
- `syncStatus`, `version`, `etag`
