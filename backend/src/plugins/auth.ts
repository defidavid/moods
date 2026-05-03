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
      return;
    }

    const header = req.headers.authorization;
    if (typeof header !== "string") {
      unauthorized(reply);
      return;
    }

    const expected = `Bearer ${TOKEN}`;
    if (header !== expected) {
      unauthorized(reply);
      return;
    }
  });
}
