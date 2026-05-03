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
