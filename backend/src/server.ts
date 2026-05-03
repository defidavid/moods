import Fastify, { type FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import fastifySensible from "@fastify/sensible";
import { loadDb } from "./db.js";
import { registerErrorHandler } from "./plugins/errorHandler.js";
import { registerAuth } from "./plugins/auth.js";
import { authRoutes } from "./routes/auth.js";

export async function buildApp(): Promise<FastifyInstance> {
  const isDev = process.env.NODE_ENV !== "production";
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      ...(isDev
        ? { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss Z", ignore: "pid,hostname" } } }
        : {}),
    },
  });

  await app.register(fastifyCors, { origin: "*" });
  await app.register(fastifySensible);

  registerErrorHandler(app);
  registerAuth(app);

  await app.register(authRoutes);

  return app;
}

async function main(): Promise<void> {
  loadDb();
  const app = await buildApp();
  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ port, host: "0.0.0.0" });
}

const isEntrypoint = import.meta.url === `file://${process.argv[1]}`;
if (isEntrypoint) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
