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
