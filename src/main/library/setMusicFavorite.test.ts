import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { upsertMusic } from "./musicRepository";
import { setMusicFavorite } from "./setMusicFavorite";
import type { MusicRowInput } from "./trackMapping";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const row = (filePath: string): MusicRowInput => ({
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
  durationMs: 0,
  bpm: null,
  rating: null,
});

const NOW = "2026-10-12T00:00:00.000Z";

const insert = (filePath: string): number => {
  upsertMusic(db, row(filePath), NOW);
  return (
    db.prepare("SELECT id FROM musics WHERE file_path = ?").get(filePath) as {
      id: number;
    }
  ).id;
};

const dbRow = (id: number): { favorite: number; updated_at: string } =>
  db
    .prepare("SELECT favorite, updated_at FROM musics WHERE id = ?")
    .get(id) as {
    favorite: number;
    updated_at: string;
  };

it("turns the flag on and off", () => {
  const id = insert("/m/a.mp3");

  setMusicFavorite(db, id, true);
  expect(dbRow(id).favorite).toBe(1);

  setMusicFavorite(db, id, false);
  expect(dbRow(id).favorite).toBe(0);
});

it("setting the current value again is a no-op that still succeeds", () => {
  const id = insert("/m/a.mp3");
  expect(() => setMusicFavorite(db, id, false)).not.toThrow();
  expect(dbRow(id).favorite).toBe(0);
});

it("leaves updated_at alone (the flag is not a tag)", () => {
  const id = insert("/m/a.mp3");
  setMusicFavorite(db, id, true);
  expect(dbRow(id).updated_at).toBe(NOW);
});

it("touches only the requested track", () => {
  const a = insert("/m/a.mp3");
  const b = insert("/m/b.mp3");
  setMusicFavorite(db, a, true);
  expect(dbRow(b).favorite).toBe(0);
});

it("reports an unknown id as NOT_FOUND", () => {
  expect(() => setMusicFavorite(db, 999, true)).toThrow(
    expect.objectContaining({ code: "NOT_FOUND" }),
  );
});
