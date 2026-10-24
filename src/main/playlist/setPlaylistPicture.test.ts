import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { getOrCreatePictureId } from "../library/getOrCreatePictureId";
import { upsertMusic } from "../library/musicRepository";
import { registerArtistPictureIfMissing } from "../library/registerArtistPictureIfMissing";
import type { MusicRowInput } from "../library/trackMapping";
import { createPlaylist } from "./createPlaylist";
import { readPlaylist } from "./readPlaylist";
import { setPlaylistPicture } from "./setPlaylistPicture";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const NOW = "2026-08-10T00:00:00.000Z";
const LATER = "2026-08-11T00:00:00.000Z";

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

const count = (): number =>
  (db.prepare("SELECT COUNT(*) AS n FROM pictures").get() as { n: number }).n;

const updatedAt = (table: string, id: number): string =>
  (
    db.prepare(`SELECT updated_at FROM ${table} WHERE id = ?`).get(id) as {
      updated_at: string;
    }
  ).updated_at;

it.each([
  ["static", "playlists"],
  ["smart", "smart_playlists"],
] as const)(
  "sets the picture of a %s playlist and bumps updated_at",
  (kind, table) => {
    const playlist = createPlaylist(
      db,
      kind === "static"
        ? { kind, name: "P" }
        : { kind, name: "S", rules: RULES },
      NOW,
    );
    const pictureId = getOrCreatePictureId(db, "/images/new.jpg");

    const orphaned = setPlaylistPicture(
      db,
      { id: playlist.id, kind },
      pictureId,
      LATER,
    );

    expect(orphaned).toEqual([]);
    expect(readPlaylist(db, kind, playlist.id).picturePath).toBe(
      "/images/new.jpg",
    );
    expect(updatedAt(table, playlist.id)).toBe(LATER);
  },
);

it("replaces the picture and GCs the old one when nothing else references it", () => {
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  setPlaylistPicture(
    db,
    { id: playlist.id, kind: "static" },
    getOrCreatePictureId(db, "/images/old.jpg"),
    NOW,
  );

  const orphaned = setPlaylistPicture(
    db,
    { id: playlist.id, kind: "static" },
    getOrCreatePictureId(db, "/images/new.jpg"),
    LATER,
  );

  expect(orphaned).toEqual(["/images/old.jpg"]);
  expect(readPlaylist(db, "static", playlist.id).picturePath).toBe(
    "/images/new.jpg",
  );
  expect(count()).toBe(1);
});

it("keeps the old picture when a track, an artist or another playlist still uses it", () => {
  const artworkId = getOrCreatePictureId(db, "/images/artwork.jpg");
  upsertMusic(db, row("/m/a.mp3"), NOW, artworkId);
  const artistId = getOrCreatePictureId(db, "/images/artist.jpg");
  registerArtistPictureIfMissing(db, "Artist", artistId);
  const sharedId = getOrCreatePictureId(db, "/images/shared.jpg");
  const other = createPlaylist(
    db,
    { kind: "smart", name: "S", rules: RULES },
    NOW,
  );
  setPlaylistPicture(db, { id: other.id, kind: "smart" }, sharedId, NOW);
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);

  for (const previous of [artworkId, artistId, sharedId]) {
    setPlaylistPicture(db, { id: playlist.id, kind: "static" }, previous, NOW);
    // Created right before use: an unreferenced row would be GC'd above.
    const newId = getOrCreatePictureId(db, "/images/new.jpg");
    expect(
      setPlaylistPicture(db, { id: playlist.id, kind: "static" }, newId, LATER),
    ).toEqual([]);
  }

  expect(count()).toBe(4);
});

it("re-setting the same picture is a no-op without GC", () => {
  const playlist = createPlaylist(db, { kind: "static", name: "P" }, NOW);
  const pictureId = getOrCreatePictureId(db, "/images/same.jpg");
  setPlaylistPicture(db, { id: playlist.id, kind: "static" }, pictureId, NOW);

  expect(
    setPlaylistPicture(
      db,
      { id: playlist.id, kind: "static" },
      pictureId,
      LATER,
    ),
  ).toEqual([]);
  expect(count()).toBe(1);
});

it("throws for an unknown playlist id and leaves the picture row alone", () => {
  const pictureId = getOrCreatePictureId(db, "/images/new.jpg");

  expect(() =>
    setPlaylistPicture(db, { id: 99, kind: "static" }, pictureId, NOW),
  ).toThrow(/not found/i);
  expect(() =>
    setPlaylistPicture(db, { id: 99, kind: "smart" }, pictureId, NOW),
  ).toThrow(/not found/i);
  expect(count()).toBe(1);
});
