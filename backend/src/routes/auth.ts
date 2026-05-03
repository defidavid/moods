import type { FastifyInstance } from "fastify";
import { LoginBody } from "../validation.js";
import type { LoginResponse } from "../types.js";

const RESPONSE: LoginResponse = {
  token: "demo-token",
  user: { id: "u1", displayName: "You" },
};

export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post("/login", async (req) => {
    LoginBody.parse(req.body ?? {});
    return RESPONSE;
  });
}
