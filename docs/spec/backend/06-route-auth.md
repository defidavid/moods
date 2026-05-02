# Backend — 06 Route: POST /login

## Purpose

Mint a session for the hardcoded demo user. Body is ignored. Always returns 200 with the literal canonical body from `spec/04-api-contract.md`. No 4xx paths.

## Files to create

- `backend/src/routes/auth.ts`

## ACs owned

None directly. This route is the dependency for AC-02 (mobile login flow) and the negative-space proof for AC-31/AC-32 (the only public endpoint, demonstrating the auth opt-in actually opts in).

## Canonical response

```json
{
  "token": "demo-token",
  "user": { "id": "u1", "displayName": "You" }
}
```

The `token` value is the literal constant `"demo-token"`. The `user.id` is `"u1"`. The `user.displayName` is `"You"`. None of these are configurable.

## `backend/src/routes/auth.ts` (canonical)

```ts
import type { FastifyInstance } from "fastify";
import { LoginBody } from "../validation.js";
import type { LoginResponse } from "../types.js";

const RESPONSE: LoginResponse = {
  token: "demo-token",
  user: { id: "u1", displayName: "You" },
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // No `protected: true` — this is the one public endpoint.
  app.post("/login", async (req) => {
    // Parse to reject obviously hostile bodies (arrays, null, primitives).
    // The body content itself is otherwise ignored.
    LoginBody.parse(req.body ?? {});
    return RESPONSE;
  });
}
```

Notes:
- Fastify infers the response status as 200 from a non-thrown return value.
- We `parse` so a `null`/array/primitive body still flows through the validation error path. The `passthrough()` in `LoginBody` allows arbitrary keys, so `{ "anything": "goes" }` succeeds — only "is this an object?" is enforced.
- The return value is a constant object. Do not allocate a fresh object per request and do not reach for `Date.now()` — the token is literal.

## Wiring

In `server.ts`:

```ts
import { authRoutes } from "./routes/auth.js";

await app.register(authRoutes);
```

Order: register `auth.ts` (public) before the protected routes. The `onRequest` hook from `05-auth-middleware.md` is global but skips routes without `config.protected`, so registration order is not load-bearing — only readability is.

## Verification (manual)

```bash
curl -s -X POST http://localhost:3000/login -H 'Content-Type: application/json' -d '{}'
```

Expected stdout (whitespace allowed to differ):

```json
{"token":"demo-token","user":{"id":"u1","displayName":"You"}}
```

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/login -d '{}' -H 'Content-Type: application/json'
```

Expected: `200`.

Also verify that no `Authorization` header is required: the same `curl` succeeds without the header. This is the single counter-example proving the auth hook's opt-in works correctly.
