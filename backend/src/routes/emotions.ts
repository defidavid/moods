import type { FastifyInstance } from "fastify";
import { EMOTIONS } from "../emotions.js";

export async function emotionRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/emotions",
    { config: { protected: true } },
    async () => ({ emotions: EMOTIONS })
  );
}
