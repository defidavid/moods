# Backend — 10 Tests

## Purpose

The vitest suite. Every test name references the AC ID it covers, so a failing test points directly to the spec line it violates. Tests use Fastify's `inject()` (no real network) and a per-test temp `DB_PATH`.

## Files to create

- `backend/vitest.config.ts`
- `backend/test/helpers/buildApp.ts` — exports a builder that returns a Fastify instance with a fresh, isolated db file.
- `backend/test/auth.test.ts`
- `backend/test/emotions.test.ts`
- `backend/test/entries.test.ts`
- `backend/test/persistence.test.ts`

## ACs covered (by file)

- `auth.test.ts` — AC-31, AC-32
- `emotions.test.ts` — `/emotions` shape + `EMOTIONS`/`EMOTION_IDS` consistency
- `entries.test.ts` — AC-28, AC-29, AC-30, AC-33, AC-34, AC-35, AC-36, AC-37
- `persistence.test.ts` — AC-24, AC-25, AC-26, AC-27

## `backend/package.json` script

Add `"test": "vitest run"` to the scripts block (already specified in `01-project-setup.md`).

## `backend/vitest.config.ts` (canonical)

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    globals: false,
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
  },
});
```

`singleFork` keeps tests deterministic; the in-memory store and the temp db path don't need parallel forks for a suite this small.

## `backend/test/helpers/buildApp.ts` (canonical)

```ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Fastify, { type FastifyInstance } from "fastify";

import { registerErrorHandler } from "../../src/plugins/errorHandler.js";
import { registerAuth } from "../../src/plugins/auth.js";
import { authRoutes } from "../../src/routes/auth.js";
import { emotionRoutes } from "../../src/routes/emotions.js";
import { entryRoutes } from "../../src/routes/entries.js";
import { loadDb } from "../../src/db.js";
import { seedIfMissing } from "../../src/seed.js";

export interface TestApp {
  app: FastifyInstance;
  dbPath: string;
  cleanup: () => Promise<void>;
}

/**
 * Build a Fastify app pointing at a fresh temp DB_PATH.
 * If `seed` is true, the seed file is copied first; otherwise the store starts empty.
 */
export async function buildApp(opts: { seed?: boolean } = {}): Promise<TestApp> {
  const dir = mkdtempSync(join(tmpdir(), "moods-"));
  const dbPath = join(dir, "db.json");
  process.env.DB_PATH = dbPath;

  if (opts.seed) seedIfMissing();
  loadDb();

  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  registerAuth(app);
  await app.register(authRoutes);
  await app.register(emotionRoutes);
  await app.register(entryRoutes);
  await app.ready();

  return {
    app,
    dbPath,
    cleanup: async () => {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export const TOKEN = "Bearer demo-token";
```

The helper sets `process.env.DB_PATH` before each `loadDb()` call. `db.ts` resolves the path lazily via `resolveDbPath()` on every IO operation (see `02-data-store.md`), so each `buildApp()` invocation is isolated to its own temp file — including across simulated restarts within a single test. This is what makes AC-24 / AC-25 / AC-26 / AC-27 actually testable in parallel cases.

## `backend/test/auth.test.ts` (canonical)

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp, TOKEN, type TestApp } from "./helpers/buildApp.js";

describe("auth middleware", () => {
  let h: TestApp;
  beforeEach(async () => { h = await buildApp(); });
  afterEach(async () => { await h.cleanup(); });

  it("AC-31: missing Authorization header → 401", async () => {
    const res = await h.app.inject({ method: "GET", url: "/entries" });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({
      error: { code: "UNAUTHORIZED", message: "invalid or missing token" },
    });
  });

  it("AC-32: wrong bearer token → 401", async () => {
    const res = await h.app.inject({
      method: "GET",
      url: "/entries",
      headers: { authorization: "Bearer wrong" },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe("UNAUTHORIZED");
  });

  it("POST /login is public (no Authorization required)", async () => {
    const res = await h.app.inject({ method: "POST", url: "/login", payload: {} });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      token: "demo-token",
      user: { id: "u1", displayName: "You" },
    });
  });
});
```

## `backend/test/emotions.test.ts` (canonical)

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp, TOKEN, type TestApp } from "./helpers/buildApp.js";
import { EMOTIONS } from "../src/emotions.js";
import { EMOTION_IDS } from "../src/validation.js";

describe("GET /emotions", () => {
  let h: TestApp;
  beforeEach(async () => { h = await buildApp(); });
  afterEach(async () => { await h.cleanup(); });

  it("returns 16 emotions with the canonical shape", async () => {
    const res = await h.app.inject({
      method: "GET",
      url: "/emotions",
      headers: { authorization: TOKEN },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.emotions).toHaveLength(16);
    expect(body.emotions[0]).toEqual({
      id: "energetic", label: "Energetic", quadrant: "yellow",
    });
  });

  it("EMOTIONS and EMOTION_IDS are kept in lockstep", () => {
    expect(EMOTIONS.map((e) => e.id)).toEqual([...EMOTION_IDS]);
  });
});
```

## `backend/test/entries.test.ts` (canonical)

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp, TOKEN, type TestApp } from "./helpers/buildApp.js";

describe("/entries", () => {
  let h: TestApp;
  beforeEach(async () => { h = await buildApp(); });
  afterEach(async () => { await h.cleanup(); });

  it("AC-28: intensity:0 → 400 VALIDATION_ERROR naming the field", async () => {
    const res = await h.app.inject({
      method: "POST", url: "/entries",
      headers: { authorization: TOKEN, "content-type": "application/json" },
      payload: { emotionId: "calm", intensity: 0 },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message.toLowerCase()).toContain("intensity");
  });

  it("AC-29: unknown emotionId → 400 with canonical message", async () => {
    const res = await h.app.inject({
      method: "POST", url: "/entries",
      headers: { authorization: TOKEN, "content-type": "application/json" },
      payload: { emotionId: "nonsense", intensity: 3 },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({
      error: { code: "VALIDATION_ERROR", message: "unknown emotionId: nonsense" },
    });
  });

  it("AC-30: note > 500 chars → 400 VALIDATION_ERROR", async () => {
    const res = await h.app.inject({
      method: "POST", url: "/entries",
      headers: { authorization: TOKEN, "content-type": "application/json" },
      payload: { emotionId: "calm", intensity: 2, note: "x".repeat(501) },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe("VALIDATION_ERROR");
  });

  it("AC-33: DELETE on missing UUID → 404 NOT_FOUND", async () => {
    const res = await h.app.inject({
      method: "DELETE",
      url: "/entries/00000000-0000-4000-8000-000000000000",
      headers: { authorization: TOKEN },
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().error.code).toBe("NOT_FOUND");
  });

  it("AC-35: note:'' is normalized to null in storage", async () => {
    const post = await h.app.inject({
      method: "POST", url: "/entries",
      headers: { authorization: TOKEN, "content-type": "application/json" },
      payload: { emotionId: "calm", intensity: 2, note: "" },
    });
    expect(post.statusCode).toBe(201);
    expect(post.json().entry.note).toBeNull();

    const list = await h.app.inject({
      method: "GET", url: "/entries", headers: { authorization: TOKEN },
    });
    expect(list.json().entries[0].note).toBeNull();
  });

  it("AC-36: client-supplied id/userId/loggedAt are ignored", async () => {
    const post = await h.app.inject({
      method: "POST", url: "/entries",
      headers: { authorization: TOKEN, "content-type": "application/json" },
      payload: {
        emotionId: "joyful", intensity: 4, note: "ok",
        id: "deadbeef", userId: "hacker", loggedAt: "1999-01-01T00:00:00.000Z",
      },
    });
    expect(post.statusCode).toBe(201);
    const e = post.json().entry;
    expect(e.id).not.toBe("deadbeef");
    expect(e.userId).toBe("u1");
    expect(e.loggedAt).not.toBe("1999-01-01T00:00:00.000Z");
    expect(new Date(e.loggedAt).getFullYear()).toBeGreaterThanOrEqual(2026);
  });

  it("AC-37: GET /entries returns desc by loggedAt", async () => {
    for (const intensity of [1, 2, 3] as const) {
      await h.app.inject({
        method: "POST", url: "/entries",
        headers: { authorization: TOKEN, "content-type": "application/json" },
        payload: { emotionId: "calm", intensity },
      });
    }
    const list = await h.app.inject({
      method: "GET", url: "/entries", headers: { authorization: TOKEN },
    });
    const ts = list.json().entries.map((e: { loggedAt: string }) => e.loggedAt);
    const sorted = [...ts].sort().reverse();
    expect(ts).toEqual(sorted);
  });

  it("AC-34: an unhandled error yields 500 INTERNAL_ERROR envelope", async () => {
    // Register a synthetic route that throws on this very app instance.
    h.app.get("/_boom", { config: { protected: true } }, async () => {
      throw new Error("kaboom");
    });
    const res = await h.app.inject({
      method: "GET", url: "/_boom", headers: { authorization: TOKEN },
    });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({
      error: { code: "INTERNAL_ERROR", message: "internal error" },
    });
  });
});
```

## `backend/test/persistence.test.ts` (canonical)

```ts
import { existsSync, readFileSync, statSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp, TOKEN, type TestApp } from "./helpers/buildApp.js";

describe("persistence", () => {
  let h: TestApp;
  afterEach(async () => { await h?.cleanup(); });

  it("AC-25: missing db.json triggers seed on boot", async () => {
    h = await buildApp({ seed: true });
    expect(existsSync(h.dbPath)).toBe(true);
    const list = await h.app.inject({
      method: "GET", url: "/entries", headers: { authorization: TOKEN },
    });
    expect(list.json().entries.length).toBeGreaterThanOrEqual(14);
  });

  it("AC-24 + AC-26: writes survive a simulated restart", async () => {
    h = await buildApp();
    const post = await h.app.inject({
      method: "POST", url: "/entries",
      headers: { authorization: TOKEN, "content-type": "application/json" },
      payload: { emotionId: "calm", intensity: 2, note: "persisted" },
    });
    const id = post.json().entry.id;

    // Simulate restart: close the app, rebuild against the same DB_PATH.
    const dbPath = h.dbPath;
    await h.app.close();
    process.env.DB_PATH = dbPath;
    h = await buildApp();

    const list = await h.app.inject({
      method: "GET", url: "/entries", headers: { authorization: TOKEN },
    });
    const ids = list.json().entries.map((e: { id: string }) => e.id);
    expect(ids).toContain(id);
  });

  it("AC-27: persist writes via tmp+rename (no partial files observable)", async () => {
    h = await buildApp();
    await h.app.inject({
      method: "POST", url: "/entries",
      headers: { authorization: TOKEN, "content-type": "application/json" },
      payload: { emotionId: "calm", intensity: 1 },
    });
    // After persist, the tmp sibling should not exist; only the canonical file.
    expect(existsSync(`${h.dbPath}.tmp`)).toBe(false);
    expect(existsSync(h.dbPath)).toBe(true);
    // File is non-zero and parses as JSON.
    expect(statSync(h.dbPath).size).toBeGreaterThan(0);
    const parsed = JSON.parse(readFileSync(h.dbPath, "utf8"));
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.entries)).toBe(true);
  });
});
```

## Verification

```bash
cd backend
npm test
```

All four files green. Failures should name the AC ID directly in the test description, so triage is one search.
