import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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

export interface BuildAppOptions {
  /** Copy db.seed.json into place before loading. */
  seed?: boolean;
  /** Reuse an existing db file (e.g. simulated restart). When omitted, a fresh tmp dir is created. */
  dbPath?: string;
}

/**
 * Build a Fastify app pointing at a fresh temp DB_PATH.
 *
 * Note: we deliberately do NOT call `app.ready()`. After ready() Fastify seals
 * route registration, and AC-34 needs to attach a synthetic /_boom route to
 * the returned instance. inject() lazily readies on first call anyway.
 */
export async function buildApp(opts: BuildAppOptions = {}): Promise<TestApp> {
  const dbPath = opts.dbPath ?? join(mkdtempSync(join(tmpdir(), "moods-")), "db.json");
  process.env.DB_PATH = dbPath;

  if (opts.seed) seedIfMissing();
  loadDb();

  const app = Fastify({ logger: false });
  registerErrorHandler(app);
  registerAuth(app);
  await app.register(authRoutes);
  await app.register(emotionRoutes);
  await app.register(entryRoutes);

  return {
    app,
    dbPath,
    cleanup: async () => {
      await app.close();
      rmSync(dirname(dbPath), { recursive: true, force: true });
    },
  };
}

export const TOKEN = "Bearer demo-token";
