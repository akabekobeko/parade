import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getOrCreatePictureId } from "../library/getOrCreatePictureId";
import { upsertMusic } from "../library/musicRepository";
import type { MusicRowInput } from "../library/trackMapping";
import { createPlaylist } from "./createPlaylist";
import { listPlaylists } from "./listPlaylists";
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

const row = (filePath: string, title: string): MusicRowInput => ({
  filePath,
  audioFormat: "mp3",
  title,
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
});

/** Insert `count` tracks (optionally sharing one artwork) and return their ids. */
const seedMusics = (count: number, artwork?: string): number[] => {
  const pictureId =
    artwork !== undefined ? getOrCreatePictureId(db, artwork) : null;
  for (let index = 0; index < count; index += 1) {
    upsertMusic(db, row(`/m/${index}.mp3`, `T${index}`), NOW, pictureId);
  }

  return (
    db.prepare("SELECT id FROM musics ORDER BY id").all() as Array<{
      id: number;
    }>
  ).map((entry) => entry.id);
};

const picturePaths = (): string[] =>
  (
    db
      .prepare("SELECT file_path FROM pictures ORDER BY file_path")
      .all() as Array<{
      file_path: string;
    }>
  ).map((entry) => entry.file_path);

it("removes a playlist and its rows, keeping the musics", () => {
  const ids = seedMusics(2);
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  updatePlaylist(db, { id: playlist.id, kind: "static", musicIds: ids }, NOW);

  expect(removePlaylist(db, { id: playlist.id, kind: "static" })).toEqual([]);
  expect(listPlaylists(db)).toEqual([]);
  expect(
    db.prepare("SELECT COUNT(*) AS count FROM playlist_musics").get(),
  ).toEqual({ count: 0 });
  expect(db.prepare("SELECT COUNT(*) AS count FROM musics").get()).toEqual({
    count: 2,
  });
});

it("removes a smart playlist whose stored rules are corrupted", () => {
  db.prepare(
    `INSERT INTO smart_playlists (id, name, rules, sort_order, created_at, updated_at)
     VALUES (9, 'Broken', 'not json', 0, ?, ?)`,
  ).run(NOW, NOW);

  removePlaylist(db, { id: 9, kind: "smart" });

  expect(db.prepare("SELECT 1 FROM smart_playlists WHERE id = 9").get()).toBe(
    undefined,
  );
});

it.each(["static", "smart"] as const)(
  "GCs the picture of a removed %s playlist when nothing else references it",
  (kind) => {
    const playlist = createPlaylist(
      db,
      kind === "static"
        ? { kind, name: "P" }
        : { kind, name: "S", rules: RULES },
      NOW,
    );
    setPlaylistPicture(
      db,
      { id: playlist.id, kind },
      getOrCreatePictureId(db, "/images/own.jpg"),
      NOW,
    );

    expect(removePlaylist(db, { id: playlist.id, kind })).toEqual([
      "/images/own.jpg",
    ]);
    expect(picturePaths()).toEqual([]);
  },
);

it("keeps a picture shared with another playlist or a track's artwork", () => {
  seedMusics(1, "/images/artwork.jpg");
  const first = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  const second = createPlaylist(
    db,
    { kind: "smart", name: "S", rules: RULES },
    NOW,
  );
  const sharedId = getOrCreatePictureId(db, "/images/shared.jpg");
  setPlaylistPicture(db, { id: first.id, kind: "static" }, sharedId, NOW);
  setPlaylistPicture(db, { id: second.id, kind: "smart" }, sharedId, NOW);
  const third = createPlaylist(db, { kind: "static", name: "Q" }, NOW);
  setPlaylistPicture(
    db,
    { id: third.id, kind: "static" },
    getOrCreatePictureId(db, "/images/artwork.jpg"),
    NOW,
  );

  expect(removePlaylist(db, { id: first.id, kind: "static" })).toEqual([]);
  expect(removePlaylist(db, { id: third.id, kind: "static" })).toEqual([]);
  expect(picturePaths()).toEqual(["/images/artwork.jpg", "/images/shared.jpg"]);
});
