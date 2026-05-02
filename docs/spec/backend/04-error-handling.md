# Backend — 04 Error Handling

## Purpose

A single Fastify plugin that converts every error path into the canonical envelope from `spec/04-api-contract.md`:

```json
{ "error": { "code": "<CODE>", "message": "<msg>" } }
```

Three buckets:
1. `ZodError` → `400 VALIDATION_ERROR` (message = first issue message).
2. `NotFoundError` → `404 NOT_FOUND` (message = `err.message`).
3. Anything else → `500 INTERNAL_ERROR` (message = `"internal error"`), and the full stack is logged at `error` level.

The 401 `UNAUTHORIZED` envelope is produced by the auth plugin directly (see `05-auth-middleware.md`); this handler never sees auth failures.

## Files to create

- `backend/src/plugins/errorHandler.ts`

## ACs owned

- **AC-34** — unhandled errors yield 500 with the standard envelope and log the stack at `error`.

This plugin also routes the AC-28/29/30 `VALIDATION_ERROR` paths and the AC-33 `NOT_FOUND` path, but those ACs are owned by the validation and entries-route files respectively.

## Error shape contract

The closed set of codes:

```ts
type ErrorCode = "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_ERROR";
```

There is no `details` field, no `stack` field, no `requestId` field. Just `code` and `message`. The mobile client's `ApiError` type depends on this exact shape (see `spec/01-data-contracts.md`).

## `backend/src/plugins/errorHandler.ts` (canonical)

```ts
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { NotFoundError } from "../errors.js";

interface ApiErrorBody {
  error: {
    code: "VALIDATION_ERROR" | "UNAUTHORIZED" | "NOT_FOUND" | "INTERNAL_ERROR";
    message: string;
  };
}

function envelope(
  code: ApiErrorBody["error"]["code"],
  message: string
): ApiErrorBody {
  return { error: { code, message } };
}

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err: FastifyError, req: FastifyRequest, reply: FastifyReply) => {
    if (err instanceof ZodError) {
      const first = err.issues[0];
      const message = first?.message ?? "validation error";
      reply.status(400).send(envelope("VALIDATION_ERROR", message));
      return;
    }

    if (err instanceof NotFoundError) {
      reply.status(404).send(envelope("NOT_FOUND", err.message));
      return;
    }

    // Fastify validation errors (if we ever wire JSON Schema later) carry
    // statusCode 400. We don't use them in v0 — every body is parsed by zod.
    if (err.statusCode === 400 && err.validation) {
      reply.status(400).send(envelope("VALIDATION_ERROR", err.message));
      return;
    }

    // Anything else: 500. Log the full error (Fastify prints the stack).
    req.log.error({ err }, "unhandled error");
    reply.status(500).send(envelope("INTERNAL_ERROR", "internal error"));
  });

  // 404 for unmatched routes — shape must still match the envelope.
  app.setNotFoundHandler((_req, reply) => {
    reply.status(404).send(envelope("NOT_FOUND", "route not found"));
  });
}
```

## Wiring

In `server.ts`:

```ts
import { registerErrorHandler } from "./plugins/errorHandler.js";

registerErrorHandler(app);
```

Register **before** routes. Fastify's `setErrorHandler` is global, but registering early avoids any surprise from a route's own per-route handler taking precedence.

## Verification

The vitest suite (see `10-tests.md`) includes:
- A test that throws a synthetic error from a temporary route and asserts the 500 envelope + log capture.
- Tests that POST invalid bodies and assert the 400 envelope.
- A test that DELETEs a non-existent UUID and asserts the 404 envelope.

Each test asserts the body exactly: `{ error: { code, message } }`. No extra keys.
