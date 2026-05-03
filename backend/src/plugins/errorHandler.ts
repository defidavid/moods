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
  message: string,
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
