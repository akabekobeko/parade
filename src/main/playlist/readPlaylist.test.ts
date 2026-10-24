import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getOrCreatePictureId } from "../library/getOrCreatePictureId";
import { upsertMusic } from "../library/musicRepository";
import type { MusicRowInput } from "../library/trackMapping";
import { createPlaylist } from "./createPlaylist";
import { getPlaylistMusics } from "./getPlaylistMusics";
import { readPlaylist } from "./readPlaylist";
import { removePlaylist } from "./removePlaylist";
import { setPlaylistPicture } from "./setPlaylistPicture";
import { updatePlaylist } from "./updatePlaylist";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const NOW = "2026-08-10T00:00:00.000Z";

const RULES = {
  version: 1,
  match: "all",
  conditions: [{ field: "genre", operator: "is", value: "Rock" }],
} as const;

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
  genre: "Rock",
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 1000,
  bpm: null,
  rating: null,
});

it("throws for unknown playlist ids", () => {
  expect(() => readPlaylist(db, "static", 99)).toThrow(/not found/i);
  expect(() => readPlaylist(db, "smart", 99)).toThrow(/not found/i);
  expect(() => removePlaylist(db, { id: 99, kind: "static" })).toThrow(
    /not found/i,
  );
  expect(() =>
    updatePlaylist(db, { id: 99, kind: "smart", name: "X" }, NOW),
  ).toThrow(/not found/i);
  expect(() =>
    getPlaylistMusics(db, { playlistId: 99, kind: "static" }),
  ).toThrow(/not found/i);
});

it("throws for a smart playlist whose stored rules are corrupted", () => {
  db.prepare(
    `INSERT INTO smart_playlists (id, name, rules, sort_order, created_at, updated_at)
     VALUES (1, 'S', '{"version":1,"match":"all"', 0, ?, ?)`,
  ).run(NOW, NOW);

  expect(() => getPlaylistMusics(db, { playlistId: 1, kind: "smart" })).toThrow(
    /not valid JSON/,
  );
  expect(() => readPlaylist(db, "smart", 1)).toThrow(/not valid JSON/);
});

it("reads a static playlist with its picture path and entry count", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  const musicId = (db.prepare("SELECT id FROM musics").get() as { id: number })
    .id;
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  expect(playlist).toMatchObject({ picturePath: null, musicCount: 0 });

  const updated = updatePlaylist(
    db,
    { id: playlist.id, kind: "static", musicIds: [musicId, musicId] },
    NOW,
  );
  expect(updated.musicCount).toBe(2);

  setPlaylistPicture(
    db,
    { id: playlist.id, kind: "static" },
    getOrCreatePictureId(db, "/images/p.jpg"),
    NOW,
  );
  expect(readPlaylist(db, "static", playlist.id)).toEqual({
    id: playlist.id,
    kind: "static",
    name: "P",
    sortOrder: 0,
    picturePath: "/images/p.jpg",
    musicCount: 2,
  });
});

it("reads a smart playlist with its picture path and evaluated count", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  upsertMusic(db, row("/m/b.mp3"), NOW);
  const playlist = createPlaylist(
    db,
    { kind: "smart", name: "S", rules: RULES },
    NOW,
  );
  expect(playlist).toMatchObject({ picturePath: null, musicCount: 2 });

  setPlaylistPicture(
    db,
    { id: playlist.id, kind: "smart" },
    getOrCreatePictureId(db, "/images/s.jpg"),
    NOW,
  );
  expect(readPlaylist(db, "smart", playlist.id)).toEqual({
    id: playlist.id,
    kind: "smart",
    name: "S",
    sortOrder: 0,
    rules: RULES,
    picturePath: "/images/s.jpg",
    musicCount: 2,
  });
});
