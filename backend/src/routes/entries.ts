import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { EntryCreateBody, EntryParams } from "../validation.js";
import { addEntry, listEntries, removeEntry } from "../store/entries.js";

export async function entryRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    "/entries",
    { config: { protected: true } },
    async () => ({ entries: listEntries() }),
  );

  app.post(
    "/entries",
    { config: { protected: true } },
    async (req: FastifyRequest, reply: FastifyReply) => {
      const body = EntryCreateBody.parse(req.body);

      const note =
        body.note === undefined || body.note === "" ? null : body.note;

      const entry = addEntry({
        emotionId: body.emotionId,
        intensity: body.intensity as 1 | 2 | 3 | 4 | 5,
        note,
      });

      reply.status(201);
      return { entry };
    },
  );

  app.delete(
    "/entries/:id",
    { config: { protected: true } },
    async (req: FastifyRequest) => {
      const { id } = EntryParams.parse(req.params);
      removeEntry(id);
      return { ok: true };
    },
  );
}
