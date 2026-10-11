import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { upsertMusic } from "./musicRepository";
import type { MusicRowInput } from "./trackMapping";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const row = (
  filePath: string,
  patch: Partial<MusicRowInput> = {},
): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title: "T",
  artist: "Artist",
  albumArtist: "",
  album: "Album",
  disc: 1,
  track: 0,
  year: null,
  genre: "",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 1000,
  bpm: null,
  rating: null,
  ...patch,
});

const NOW = "2026-10-12T00:00:00.000Z";
const LATER = "2026-10-13T00:00:00.000Z";

const dbRow = (filePath: string): Record<string, unknown> =>
  db
    .prepare("SELECT * FROM musics WHERE file_path = ?")
    .get(filePath) as Record<string, unknown>;

it("inserts a new row and reports it as inserted", () => {
  expect(upsertMusic(db, row("/m/a.mp3"), NOW)).toBe("inserted");
  expect(dbRow("/m/a.mp3")).toMatchObject({
    title: "T",
    added_at: NOW,
    updated_at: NOW,
  });
});

it("refreshes the tags of an existing path while keeping id and added_at", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  const before = dbRow("/m/a.mp3");

  expect(upsertMusic(db, row("/m/a.mp3", { title: "Renamed" }), LATER)).toBe(
    "updated",
  );
  const after = dbRow("/m/a.mp3");
  expect(after.id).toBe(before.id);
  expect(after.added_at).toBe(NOW);
  expect(after.updated_at).toBe(LATER);
  expect(after.title).toBe("Renamed");
});

it("inserts a new row with favorite off", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  expect(dbRow("/m/a.mp3").favorite).toBe(0);
});

it("keeps favorite on across a re-upsert of the same path", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  db.prepare("UPDATE musics SET favorite = 1 WHERE file_path = ?").run(
    "/m/a.mp3",
  );

  // A re-import / tag edit rewrites every tag column but not the flag.
  upsertMusic(db, row("/m/a.mp3", { title: "Renamed", rating: 0.5 }), LATER);
  expect(dbRow("/m/a.mp3")).toMatchObject({
    title: "Renamed",
    rating: 0.5,
    favorite: 1,
  });
});
