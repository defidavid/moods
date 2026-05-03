import { existsSync, readFileSync, statSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { buildApp, TOKEN, type TestApp } from "./helpers/buildApp.js";

describe("persistence", () => {
  let h: TestApp;
  afterEach(async () => { await h?.cleanup(); });

  it("AC-25: missing db.json triggers seed on boot", async () => {
    h = await buildApp({ seed: true });
    expect(existsSync(h.dbPath)).toBe(true);
    const list = await h.app.inject({
      method: "GET", url: "/entries", headers: { authorization: TOKEN },
    });
    expect(list.json().entries.length).toBeGreaterThanOrEqual(14);
  });

  it("AC-24 + AC-26: writes survive a simulated restart", async () => {
    h = await buildApp();
    const post = await h.app.inject({
      method: "POST", url: "/entries",
      headers: { authorization: TOKEN, "content-type": "application/json" },
      payload: { emotionId: "calm", intensity: 2, note: "persisted" },
    });
    const id = post.json().entry.id;

    // Simulate restart: close the app, rebuild against the same DB_PATH.
    const dbPath = h.dbPath;
    await h.app.close();
    h = await buildApp({ dbPath });

    const list = await h.app.inject({
      method: "GET", url: "/entries", headers: { authorization: TOKEN },
    });
    const ids = list.json().entries.map((e: { id: string }) => e.id);
    expect(ids).toContain(id);
  });

  it("AC-27: persist writes via tmp+rename (no partial files observable)", async () => {
    h = await buildApp();
    await h.app.inject({
      method: "POST", url: "/entries",
      headers: { authorization: TOKEN, "content-type": "application/json" },
      payload: { emotionId: "calm", intensity: 1 },
    });
    // After persist, the tmp sibling should not exist; only the canonical file.
    expect(existsSync(`${h.dbPath}.tmp`)).toBe(false);
    expect(existsSync(h.dbPath)).toBe(true);
    // File is non-zero and parses as JSON.
    expect(statSync(h.dbPath).size).toBeGreaterThan(0);
    const parsed = JSON.parse(readFileSync(h.dbPath, "utf8"));
    expect(parsed.version).toBe(1);
    expect(Array.isArray(parsed.entries)).toBe(true);
  });
});
