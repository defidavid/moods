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
