import { v4 as uuidv4 } from "uuid";
import { _entriesMap, persist } from "../db.js";
import type { MoodEntry } from "../types.js";
import { NotFoundError } from "../errors.js";

export interface EntryCreateInput {
  emotionId: string;
  intensity: 1 | 2 | 3 | 4 | 5;
  note: string | null;
}

/** All entries, sorted by loggedAt descending (newest first). AC-37. */
export function listEntries(): MoodEntry[] {
  const all = Array.from(_entriesMap().values());
  all.sort((a, b) => (a.loggedAt < b.loggedAt ? 1 : a.loggedAt > b.loggedAt ? -1 : 0));
  return all;
}

/** Insert, persist, return the persisted entry. */
export function addEntry(input: EntryCreateInput): MoodEntry {
  const entry: MoodEntry = {
    id: uuidv4(),
    userId: "u1",
    emotionId: input.emotionId,
    intensity: input.intensity,
    note: input.note,
    loggedAt: new Date().toISOString(),
  };
  _entriesMap().set(entry.id, entry);
  persist();
  return entry;
}

/** Hard delete. Throws NotFoundError if absent. */
export function removeEntry(id: string): void {
  const map = _entriesMap();
  if (!map.has(id)) {
    throw new NotFoundError(`entry not found: ${id}`);
  }
  map.delete(id);
  persist();
}
