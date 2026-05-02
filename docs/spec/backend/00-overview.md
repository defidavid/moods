# Backend — 00 Overview

## Purpose

The big-picture map of the backend slice. Read this once, then go straight to the file you need to implement. Every detail here is expanded in a sibling file under `spec/backend/`.

The backend is a single-process Fastify HTTP server that:
- Speaks JSON over HTTP on `localhost:3000`.
- Authenticates with a hardcoded bearer token (`demo-token`).
- Validates every request body with zod.
- Stores entries in a `Map<string, MoodEntry>` in memory.
- Persists the map to `db.json` after every mutation via an atomic tmp+rename.
- Seeds `db.json` on first boot from a bundled fixture.

No DB engine, no auth provider, no caching layer, no queue. The whole thing is a few hundred lines of TypeScript.

## Stack

Pinned by `spec/00-stack.md`:
- `node >=20.10` (declared in `engines`)
- `fastify ^4.26.0` + `@fastify/cors ^9.0.0` + `@fastify/sensible ^5.5.0`
- `zod ^3.23.0`
- `uuid ^9.0.1`
- `pino-pretty ^11.0.0` (dev logging only)
- `tsx ^4.7.0` (dev runner)
- `typescript ~5.3.0`
- `vitest ^1.5.0`

No additions. If a problem seems to need a new dep, the answer is no — re-read the file.

## Tooling

- Package manager: `npm` (committed lockfile).
- TypeScript: `strict: true`, `module: NodeNext`, `target: ES2022`.
- Run: `npm run dev` (tsx watch) and `npm test` (vitest).

## Environment variables

| Var         | Default            | Purpose                               |
|-------------|--------------------|---------------------------------------|
| `PORT`      | `3000`             | HTTP listen port                      |
| `DB_PATH`   | `./db.json`        | Where the JSON store lives            |
| `LOG_LEVEL` | `info`             | Fastify/pino log level                |

All optional. The server reads them once at boot via `process.env`.

## Source tree

```
backend/
├── package.json
├── tsconfig.json
├── .gitignore
├── db.seed.json                  # checked in; copied to db.json on first boot
├── src/
│   ├── server.ts                 # entrypoint: build app, register plugins/routes, listen
│   ├── db.ts                     # loadDb() + persist() — the only filesystem code
│   ├── seed.ts                   # writes db.seed.json -> db.json if missing
│   ├── types.ts                  # copied verbatim from spec/01-data-contracts.md
│   ├── emotions.ts               # canonical 16-emotion array (matches spec/02)
│   ├── validation.ts             # zod schemas + inferred types
│   ├── errors.ts                 # NotFoundError class
│   ├── store/
│   │   └── entries.ts            # listEntries / addEntry / removeEntry
│   ├── plugins/
│   │   ├── auth.ts               # onRequest hook: Bearer demo-token
│   │   └── errorHandler.ts       # zod -> 400, NotFoundError -> 404, else 500
│   └── routes/
│       ├── auth.ts               # POST /login
│       ├── emotions.ts           # GET /emotions
│       └── entries.ts            # GET / POST / DELETE
└── test/
    ├── auth.test.ts
    ├── emotions.test.ts
    ├── entries.test.ts
    └── persistence.test.ts
```

`server.ts` is illustrative only — its content is the obvious composition of everything above. No spec file owns it explicitly; it must:
1. Call `loadDb()` (or `seed()` then `loadDb()`).
2. Build a Fastify instance with pino-pretty in dev.
3. Register `@fastify/cors` (origin `*`), `@fastify/sensible`, `errorHandler`, `auth`.
4. Register routes: auth (no auth), then emotions + entries (auth required).
5. Listen on `PORT`.

## Acceptance criteria owned by the backend phase

The backend phase satisfies AC-24 through AC-37 (inclusive). The integration ACs (AC-38, AC-39, AC-40) depend on the backend but are checked end-to-end against the running mobile app.

| AC      | Owned by                                  |
|---------|-------------------------------------------|
| AC-24   | `02-data-store.md` (loadDb hydrates before listen) |
| AC-25   | `09-seed-data.md` (seed runs on missing db) |
| AC-26   | `02-data-store.md` (round-trip via persist) |
| AC-27   | `02-data-store.md` (atomic tmp+rename)    |
| AC-28   | `03-validation.md` (intensity range)      |
| AC-29   | `03-validation.md` (emotionId enum)       |
| AC-30   | `03-validation.md` (note max length)      |
| AC-31   | `05-auth-middleware.md` (no header → 401) |
| AC-32   | `05-auth-middleware.md` (wrong token → 401) |
| AC-33   | `08-route-entries.md` (404 on missing id) |
| AC-34   | `04-error-handling.md` (500 envelope + log) |
| AC-35   | `08-route-entries.md` (note "" → null)    |
| AC-36   | `08-route-entries.md` (server-assigned fields) |
| AC-37   | `02-data-store.md` (sort desc by loggedAt) |

## Read order

If you are implementing the backend from scratch, follow the build sequence in `spec/06-build-sequence.md` Phase 1 (steps 1.1 through 1.11). Each step maps to one file in this directory.
