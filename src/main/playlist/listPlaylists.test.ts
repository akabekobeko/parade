import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getOrCreatePictureId } from "../library/getOrCreatePictureId";
import { upsertMusic } from "../library/musicRepository";
import type { MusicRowInput } from "../library/trackMapping";
import { createPlaylist } from "./createPlaylist";
import { listPlaylists } from "./listPlaylists";
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

const row = (filePath: string, genre: string): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title: "T",
  artist: "Artist",
  albumArtist: "",
  album: "Album",
  disc: 1,
  track: 0,
  year: null,
  genre,
  composer: "",
  lyricist: "",
  producer: "",
  conductor: "",
  publisher: "",
  durationMs: 1000,
  bpm: null,
  rating: null,
});

/** Insert tracks of one genre and return their ids in insertion order. */
const seedMusics = (count: number, genre = "Rock"): number[] => {
  for (let index = 0; index < count; index += 1) {
    upsertMusic(db, row(`/m/${genre}-${index}.mp3`, genre), NOW);
  }

  return (
    db
      .prepare("SELECT id FROM musics WHERE genre = ? ORDER BY id")
      .all(genre) as Array<{ id: number }>
  ).map((entry) => entry.id);
};

it("lists static playlists before smart ones, each by sort order", () => {
  createPlaylist(db, { kind: "smart", name: "S", rules: RULES }, NOW);
  createPlaylist(db, { kind: "static", name: "B" }, NOW);
  createPlaylist(db, { kind: "static", name: "A" }, NOW);

  expect(listPlaylists(db).map((entry) => [entry.kind, entry.name])).toEqual([
    ["static", "B"],
    ["static", "A"],
    ["smart", "S"],
  ]);
});

it("returns the picture path of each playlist, null without one", () => {
  const withPicture = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  createPlaylist(db, { kind: "static", name: "Q" }, NOW);
  const smart = createPlaylist(
    db,
    { kind: "smart", name: "S", rules: RULES },
    NOW,
  );
  setPlaylistPicture(
    db,
    { id: withPicture.id, kind: "static" },
    getOrCreatePictureId(db, "/images/p.jpg"),
    NOW,
  );
  setPlaylistPicture(
    db,
    { id: smart.id, kind: "smart" },
    getOrCreatePictureId(db, "/images/s.jpg"),
    NOW,
  );

  expect(
    listPlaylists(db).map((entry) => [entry.name, entry.picturePath]),
  ).toEqual([
    ["P", "/images/p.jpg"],
    ["Q", null],
    ["S", "/images/s.jpg"],
  ]);
});

it("counts a static playlist's entries, duplicates included", () => {
  const [first, second] = seedMusics(2) as [number, number];
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  updatePlaylist(
    db,
    { id: playlist.id, kind: "static", musicIds: [first, second, first] },
    NOW,
  );
  createPlaylist(db, { kind: "static", name: "Empty" }, NOW);

  expect(listPlaylists(db).map((entry) => entry.musicCount)).toEqual([3, 0]);
});

it("counts a smart playlist's matches, stopping at its limit", () => {
  seedMusics(5, "Rock");
  seedMusics(2, "Jazz");
  createPlaylist(db, { kind: "smart", name: "All rock", rules: RULES }, NOW);
  createPlaylist(
    db,
    {
      kind: "smart",
      name: "Two rock",
      rules: { ...RULES, limit: 2, sort: { field: "random" } },
    },
    NOW,
  );
  createPlaylist(
    db,
    {
      kind: "smart",
      name: "Nothing",
      rules: {
        ...RULES,
        conditions: [{ field: "genre", operator: "is", value: "Pop" }],
      },
    },
    NOW,
  );

  expect(
    listPlaylists(db).map((entry) => [entry.name, entry.musicCount]),
  ).toEqual([
    ["All rock", 5],
    ["Two rock", 2],
    ["Nothing", 0],
  ]);
});

it("keeps a smart playlist whose stored rules are corrupted, without rules and with zero tracks", () => {
  seedMusics(1);
  createPlaylist(db, { kind: "smart", name: "S", rules: RULES }, NOW);
  db.prepare(
    `INSERT INTO smart_playlists (id, name, rules, sort_order, created_at, updated_at)
     VALUES (9, 'Broken', '{"version":1,"match":"all"', 1, ?, ?)`,
  ).run(NOW, NOW);
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  expect(listPlaylists(db)).toEqual([
    {
      id: 1,
      kind: "smart",
      name: "S",
      sortOrder: 0,
      rules: RULES,
      picturePath: null,
      musicCount: 1,
    },
    {
      id: 9,
      kind: "smart",
      name: "Broken",
      sortOrder: 1,
      picturePath: null,
      musicCount: 0,
    },
  ]);
  expect(warn).toHaveBeenCalledOnce();
  warn.mockRestore();
});
