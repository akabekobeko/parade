import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { albumKeyOf } from "../../shared/albumKeyOf";
import { runMigrations } from "../db/runMigrations";
import { upsertMusic } from "./musicRepository";
import { setAlbumFavorite } from "./setAlbumFavorite";
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
  durationMs: 0,
  bpm: null,
  rating: null,
  ...patch,
});

const NOW = "2026-10-12T00:00:00.000Z";

const rows = (): Array<{ artist: string; album: string }> =>
  db
    .prepare("SELECT artist, album FROM album_favorites ORDER BY artist, album")
    .all() as Array<{ artist: string; album: string }>;

it("turns an album on by inserting its key", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  setAlbumFavorite(db, albumKeyOf("Artist", "Album"), true);
  expect(rows()).toEqual([{ artist: "Artist", album: "Album" }]);
});

it("turning an album on twice keeps a single row", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  setAlbumFavorite(db, albumKeyOf("Artist", "Album"), true);
  setAlbumFavorite(db, albumKeyOf("Artist", "Album"), true);
  expect(rows()).toHaveLength(1);
});

it("turns an album off by deleting its key", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  upsertMusic(db, row("/m/b.mp3", { album: "Other" }), NOW);
  setAlbumFavorite(db, albumKeyOf("Artist", "Album"), true);
  setAlbumFavorite(db, albumKeyOf("Artist", "Other"), true);

  setAlbumFavorite(db, albumKeyOf("Artist", "Album"), false);
  expect(rows()).toEqual([{ artist: "Artist", album: "Other" }]);
});

it("turning off an album that is not a favorite is a no-op", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  expect(() =>
    setAlbumFavorite(db, albumKeyOf("Artist", "Album"), false),
  ).not.toThrow();
  expect(rows()).toEqual([]);
});

it("keys on the display artist (album_artist falling back to artist)", () => {
  upsertMusic(
    db,
    row("/m/a.mp3", { artist: "Track Artist", albumArtist: "Album Artist" }),
    NOW,
  );
  setAlbumFavorite(db, albumKeyOf("Album Artist", "Album"), true);
  expect(rows()).toEqual([{ artist: "Album Artist", album: "Album" }]);
  // "Track Artist" is not a display artist here, so its row is an orphan.
  setAlbumFavorite(db, albumKeyOf("Track Artist", "Album"), true);
  expect(rows()).toEqual([{ artist: "Album Artist", album: "Album" }]);
});

it("accepts the unknown-artist bucket and an untitled album", () => {
  upsertMusic(db, row("/m/a.mp3", { artist: "", album: "Demos" }), NOW);
  upsertMusic(db, row("/m/b.mp3", { album: "" }), NOW);

  setAlbumFavorite(db, albumKeyOf("", "Demos"), true);
  setAlbumFavorite(db, albumKeyOf("Artist", ""), true);
  expect(rows()).toEqual([
    { artist: "", album: "Demos" },
    { artist: "Artist", album: "" },
  ]);

  setAlbumFavorite(db, albumKeyOf("", "Demos"), false);
  expect(rows()).toEqual([{ artist: "Artist", album: "" }]);
});

it("drops the row again when the album has no tracks", () => {
  setAlbumFavorite(db, albumKeyOf("Ghost", "Album"), true);
  expect(rows()).toEqual([]);
});

it("GCs a favorite stranded earlier by a removal, whichever album is toggled", () => {
  upsertMusic(db, row("/m/a.mp3"), NOW);
  upsertMusic(db, row("/m/gone.mp3", { album: "Gone" }), NOW);
  setAlbumFavorite(db, albumKeyOf("Artist", "Gone"), true);
  db.prepare("DELETE FROM musics WHERE file_path = ?").run("/m/gone.mp3");

  setAlbumFavorite(db, albumKeyOf("Artist", "Album"), true);
  expect(rows()).toEqual([{ artist: "Artist", album: "Album" }]);
});

it("rejects a key without the separator", () => {
  expect(() => setAlbumFavorite(db, "Artist Album", true)).toThrow(
    "Malformed album key",
  );
});
