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
