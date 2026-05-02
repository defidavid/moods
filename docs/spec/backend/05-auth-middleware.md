# Backend — 05 Auth Middleware

## Purpose

A Fastify `onRequest` hook that gates every protected route on the literal header:

```
Authorization: Bearer demo-token
```

Anything else — missing header, wrong scheme, wrong token — yields `401 UNAUTHORIZED` with the canonical error envelope, and the route handler is never invoked.

## Files to create

- `backend/src/plugins/auth.ts`

## ACs owned

- **AC-31** — no `Authorization` header on a protected endpoint → 401, handler does not execute.
- **AC-32** — `Authorization: Bearer wrong` → 401.

## Mechanism

Fastify lets a hook be opted into per-route via `routeOptions.config`. We use a config flag `protected: true`. The hook reads the flag from `request.routeOptions.config` and skips routes that did not opt in (`/login`).

This is preferable to "register hook at a prefix" because in v0 there's only one unprotected route (`POST /login`) and the prefix layout is flat. A flag is one line per route.

## `backend/src/plugins/auth.ts` (canonical)

```ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const TOKEN = "demo-token";

declare module "fastify" {
  interface FastifyContextConfig {
    /** When true, the auth hook enforces Bearer demo-token. Default: false. */
    protected?: boolean;
  }
}

function unauthorized(reply: FastifyReply): void {
  reply.status(401).send({
    error: { code: "UNAUTHORIZED", message: "invalid or missing token" },
  });
}

export function registerAuth(app: FastifyInstance): void {
  app.addHook("onRequest", async (req: FastifyRequest, reply: FastifyReply) => {
    const config = req.routeOptions?.config;
    if (!config?.protected) {
      return; // route is public (e.g. /login) or unmatched (404 path)
    }

    const header = req.headers.authorization;
    if (typeof header !== "string") {
      unauthorized(reply);
      return;
    }

    // Accept exactly "Bearer demo-token". Case-sensitive on the scheme to keep
    // surface area predictable; spec is explicit.
    const expected = `Bearer ${TOKEN}`;
    if (header !== expected) {
      unauthorized(reply);
      return;
    }

    // Token valid: fall through to the route handler.
  });
}
```

Notes:
- `onRequest` fires before body parsing and before the route handler. Calling `reply.send()` here short-circuits the handler — satisfies "handler does not execute" in AC-31.
- We use `req.routeOptions.config` (Fastify v4). The module augmentation above adds the `protected` field with type safety.
- The token comparison is exact-string equality. There is no JWT, no expiry, no refresh.

## Per-route opt-in

In each protected route file:

```ts
app.get("/entries", { config: { protected: true } }, handler);
app.post("/entries", { config: { protected: true } }, handler);
app.delete("/entries/:id", { config: { protected: true } }, handler);
app.get("/emotions", { config: { protected: true } }, handler);
```

`POST /login` omits the flag. Anything new added later without `protected: true` is implicitly public — reviewers must check.

## Wiring

In `server.ts`, register after `errorHandler` and before routes:

```ts
import { registerErrorHandler } from "./plugins/errorHandler.js";
import { registerAuth } from "./plugins/auth.js";

registerErrorHandler(app);
registerAuth(app);
// then routes
```

## Verification

The vitest auth suite (see `10-tests.md`) covers, for at least one protected route:
- No `Authorization` header → 401 with `{ error: { code: "UNAUTHORIZED", message: "invalid or missing token" } }` (AC-31).
- `Authorization: Bearer wrong` → 401 same envelope (AC-32).
- `Authorization: Bearer demo-token` → 200 (handler ran).

Additionally a test asserts that `POST /login` without any header succeeds (200), proving the opt-in flag actually opts in.
