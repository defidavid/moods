# Mobile 04 — API Client

## Purpose

A typed, single-file fetch wrapper at `lib/api.ts` exposes one function per endpoint in `spec/04-api-contract.md`. Centralizes base URL, auth header, JSON serialization, error envelope parsing, and the 401 → logout side-effect. Screens and the store import only `api` and `ApiError`; nothing else touches `fetch` or URLs.

## Files to create

- `/lib/api.ts`

## Module surface

```ts
export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  constructor(status: number, code: ErrorCode, message: string);
}

export const api: {
  login: () => Promise<LoginResponse>;
  getEmotions: () => Promise<Emotion[]>;
  getEntries: () => Promise<MoodEntry[]>;
  createEntry: (input: CreateEntryInput) => Promise<MoodEntry>;
  deleteEntry: (id: string) => Promise<void>;
};

export interface CreateEntryInput {
  emotionId: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  note: string | null;
}
```

## `lib/api.ts` — full implementation

```ts
import type {
  Emotion,
  ErrorCode,
  LoginResponse,
  MoodEntry,
} from "./types";
import { storeApi } from "./store";

const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ?? "http://localhost:3000";

export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  constructor(status: number, code: ErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export interface CreateEntryInput {
  emotionId: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  note: string | null;
}

type Method = "GET" | "POST" | "DELETE";

interface RequestOptions {
  method: Method;
  path: string;
  body?: unknown;
  auth: boolean;
}

async function request<T>(opts: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (opts.auth) {
    const token = storeApi.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${opts.path}`, {
      method: opts.method,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    // Network error — wrap as INTERNAL_ERROR with status 0.
    throw new ApiError(0, "INTERNAL_ERROR", "Network request failed");
  }

  // 401: clear auth before throwing so the auth gate redirects.
  if (res.status === 401) {
    await storeApi.clearAuth();
    throw new ApiError(401, "UNAUTHORIZED", "Session expired");
  }

  let payload: unknown = null;
  const text = await res.text();
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new ApiError(res.status, "INTERNAL_ERROR", "Invalid JSON from server");
    }
  }

  if (!res.ok) {
    const env = payload as { error?: { code?: ErrorCode; message?: string } } | null;
    const code = env?.error?.code ?? "INTERNAL_ERROR";
    const message = env?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, code, message);
  }

  return payload as T;
}

export const api = {
  login: async (): Promise<LoginResponse> => {
    return request<LoginResponse>({
      method: "POST",
      path: "/login",
      body: {},
      auth: false,
    });
  },

  getEmotions: async (): Promise<Emotion[]> => {
    const res = await request<{ emotions: Emotion[] }>({
      method: "GET",
      path: "/emotions",
      auth: true,
    });
    return res.emotions;
  },

  getEntries: async (): Promise<MoodEntry[]> => {
    const res = await request<{ entries: MoodEntry[] }>({
      method: "GET",
      path: "/entries",
      auth: true,
    });
    return res.entries;
  },

  createEntry: async (input: CreateEntryInput): Promise<MoodEntry> => {
    const body = {
      emotionId: input.emotionId,
      intensity: input.intensity,
      note: input.note, // null when omitted; never "" — see AC-12
    };
    const res = await request<{ entry: MoodEntry }>({
      method: "POST",
      path: "/entries",
      body,
      auth: true,
    });
    return res.entry;
  },

  deleteEntry: async (id: string): Promise<void> => {
    await request<{ ok: true }>({
      method: "DELETE",
      path: `/entries/${encodeURIComponent(id)}`,
      auth: true,
    });
  },
};
```

## Behavior notes

- **Base URL.** Read once at module load via `process.env.EXPO_PUBLIC_API_URL`. Expo inlines `EXPO_PUBLIC_*` at bundle time; no runtime config plumbing needed.
- **Auth header.** Pulled fresh per request from `storeApi.getToken()` so a login during the session is reflected immediately.
- **401 handling.** Calls `storeApi.clearAuth()` then throws. The store change re-renders `app/_layout.tsx`, which redirects to `/login` (AC-04).
- **Network failure.** `fetch` rejecting (no response at all) becomes `ApiError(0, "INTERNAL_ERROR", "Network request failed")`. The log screen surfaces this as the AC-39 toast.
- **Empty body.** `DELETE /entries/:id` returns `{ "ok": true }` per `spec/04`; we ignore the body.
- **Note normalization.** `createEntry` passes `null` through unchanged. Callers (the log screen) must convert empty input to `null` themselves before calling — see AC-12.
- **No retries, no timeouts, no AbortController.** v0 keeps it minimal.
- **No interceptors / middleware.** All side-effects live in `request()`.

## Import hygiene

- `lib/api.ts` may import from `lib/store.ts` (only `storeApi`, never `useStore`).
- `lib/store.ts` must NOT import from `lib/api.ts` to avoid a cycle. Boot-time API calls live in `app/_layout.tsx`.
- Screens import `{ api, ApiError }` from `lib/api`. They do not import `request` or `BASE_URL`.

## Error mapping table

| Server status | `ApiError.code`       | Surface in UI                                    |
|---------------|-----------------------|--------------------------------------------------|
| `0` (network) | `INTERNAL_ERROR`      | "Couldn't save. Try again." toast (AC-39)        |
| `400`         | `VALIDATION_ERROR`    | Same toast on the log screen; surfaced verbatim elsewhere |
| `401`         | `UNAUTHORIZED`        | Redirect to `/login` via store (AC-04)           |
| `404`         | `NOT_FOUND`           | Entry detail: alert "Already deleted", pop back  |
| `500`         | `INTERNAL_ERROR`      | Toast / alert as appropriate                     |

## ACs in scope

- **AC-04** — 401 path clears AsyncStorage and triggers redirect via the store.
- Provides the wire layer used by AC-02, AC-11, AC-15, AC-18, AC-22.
- **AC-39** path: network failures throw `ApiError`, log screen catches and shows toast.
- **AC-40** path: `getEmotions` failure leaves bundled `EMOTIONS` in the store.
