import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { _entriesMap, loadDb } from "../src/db.js";
import { addEntry, listEntries, removeEntry } from "../src/store/entries.js";
import { NotFoundError } from "../src/errors.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "moods-entries-"));
  process.env.DB_PATH = join(tmpDir, "db.json");
  loadDb();
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.DB_PATH;
});

describe("store/entries.ts", () => {
  describe("addEntry", () => {
    it("assigns server-generated id, userId='u1', and loggedAt", () => {
      const entry = addEntry({ emotionId: "energetic", intensity: 4, note: "hi" });

      expect(entry.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(entry.userId).toBe("u1");
      expect(entry.emotionId).toBe("energetic");
      expect(entry.intensity).toBe(4);
      expect(entry.note).toBe("hi");
      expect(new Date(entry.loggedAt).toISOString()).toBe(entry.loggedAt);
    });

    it("preserves note=null", () => {
      const entry = addEntry({ emotionId: "calm", intensity: 2, note: null });
      expect(entry.note).toBeNull();
    });

    it("persists the entry to the in-memory map", () => {
      const entry = addEntry({ emotionId: "happy", intensity: 3, note: null });
      expect(_entriesMap().get(entry.id)).toEqual(entry);
    });
  });

  describe("listEntries (AC-37)", () => {
    it("returns entries sorted by loggedAt descending", async () => {
      const a = addEntry({ emotionId: "a", intensity: 1, note: null });
      await new Promise((r) => setTimeout(r, 5));
      const b = addEntry({ emotionId: "b", intensity: 2, note: null });
      await new Promise((r) => setTimeout(r, 5));
      const c = addEntry({ emotionId: "c", intensity: 3, note: null });

      const result = listEntries();
      expect(result.map((e) => e.id)).toEqual([c.id, b.id, a.id]);
    });

    it("returns an empty array when the store is empty", () => {
      expect(listEntries()).toEqual([]);
    });
  });

  describe("removeEntry", () => {
    it("hard-deletes the entry from the map", () => {
      const entry = addEntry({ emotionId: "energetic", intensity: 4, note: null });
      removeEntry(entry.id);
      expect(_entriesMap().has(entry.id)).toBe(false);
    });

    it("throws NotFoundError when the id does not exist (AC-33 maps to 404)", () => {
      expect(() => removeEntry("does-not-exist")).toThrow(NotFoundError);
    });
  });
});
