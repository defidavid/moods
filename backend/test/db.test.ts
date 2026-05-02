import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { _dbPath, _entriesMap, loadDb, persist } from "../src/db.js";
import type { MoodEntry } from "../src/types.js";

const sampleEntry: MoodEntry = {
  id: "8f1c0d72-2b05-4a5e-9b3a-1f7d4f8e8c11",
  userId: "u1",
  emotionId: "energetic",
  intensity: 4,
  note: "Coffee + sunshine.",
  loggedAt: "2026-05-02T18:14:00.000Z",
};

let tmpDir: string;
let dbPath: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), "moods-db-"));
  dbPath = join(tmpDir, "db.json");
  process.env.DB_PATH = dbPath;
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
  delete process.env.DB_PATH;
  vi.restoreAllMocks();
});

describe("db.ts", () => {
  describe("loadDb", () => {
    it("initializes empty store when db.json does not exist (AC-24)", () => {
      loadDb();
      expect(_entriesMap().size).toBe(0);
    });

    it("hydrates the store from db.json on disk (AC-24)", () => {
      writeFileSync(
        dbPath,
        JSON.stringify({ version: 1, entries: [sampleEntry] }),
        "utf8",
      );
      loadDb();
      expect(_entriesMap().size).toBe(1);
      expect(_entriesMap().get(sampleEntry.id)).toEqual(sampleEntry);
    });

    it("rejects unsupported version", () => {
      writeFileSync(dbPath, JSON.stringify({ version: 2, entries: [] }), "utf8");
      expect(() => loadDb()).toThrow(/unsupported version 2/);
    });

    it("propagates JSON parse errors when db.json is malformed", () => {
      writeFileSync(dbPath, "not json at all", "utf8");
      expect(() => loadDb()).toThrow();
    });

    it("resolves DB_PATH lazily so tests can swap paths between calls", () => {
      const otherPath = join(tmpDir, "other.json");
      writeFileSync(
        otherPath,
        JSON.stringify({ version: 1, entries: [sampleEntry] }),
        "utf8",
      );
      loadDb();
      expect(_entriesMap().size).toBe(0);

      process.env.DB_PATH = otherPath;
      loadDb();
      expect(_entriesMap().size).toBe(1);
      expect(_dbPath()).toBe(otherPath);
    });
  });

  describe("persist (AC-27 atomic write)", () => {
    it("throws when persist() is called before loadDb()", async () => {
      vi.resetModules();
      const fresh = await import("../src/db.js");
      expect(() => fresh.persist()).toThrow(/persist\(\) called before loadDb\(\)/);
    });

    it("writes via .tmp sibling and renames into place (AC-27)", async () => {
      vi.resetModules();
      const callLog: Array<["write" | "rename", ...string[]]> = [];
      vi.doMock("node:fs", async () => {
        const actual =
          await vi.importActual<typeof import("node:fs")>("node:fs");
        return {
          ...actual,
          writeFileSync: (path: string, data: string, enc: string) => {
            callLog.push(["write", path]);
            actual.writeFileSync(path, data, enc as BufferEncoding);
          },
          renameSync: (from: string, to: string) => {
            callLog.push(["rename", from, to]);
            actual.renameSync(from, to);
          },
        };
      });

      const fresh = await import("../src/db.js");
      fresh.loadDb();
      fresh._entriesMap().set(sampleEntry.id, sampleEntry);
      fresh.persist();

      expect(callLog).toEqual([
        ["write", `${dbPath}.tmp`],
        ["rename", `${dbPath}.tmp`, dbPath],
      ]);

      vi.doUnmock("node:fs");
    });

    it("does not leave a .tmp file on the filesystem after a successful persist", () => {
      loadDb();
      _entriesMap().set(sampleEntry.id, sampleEntry);
      persist();
      expect(existsSync(`${dbPath}.tmp`)).toBe(false);
      expect(existsSync(dbPath)).toBe(true);
      expect(readdirSync(tmpDir).sort()).toEqual(["db.json"]);
    });

    it("writes a valid DbShape that loadDb can re-hydrate (AC-26 round-trip)", () => {
      loadDb();
      _entriesMap().set(sampleEntry.id, sampleEntry);
      persist();

      _entriesMap().clear();
      loadDb();

      expect(_entriesMap().size).toBe(1);
      expect(_entriesMap().get(sampleEntry.id)).toEqual(sampleEntry);
    });

    it("persists version sentinel as 1", () => {
      loadDb();
      persist();
      const onDisk = JSON.parse(readFileSync(dbPath, "utf8"));
      expect(onDisk.version).toBe(1);
      expect(onDisk.entries).toEqual([]);
    });
  });

  describe("_entriesMap", () => {
    it("throws when called before loadDb()", async () => {
      vi.resetModules();
      const fresh = await import("../src/db.js");
      expect(() => fresh._entriesMap()).toThrow(/_entriesMap\(\) called before loadDb\(\)/);
    });
  });
});
