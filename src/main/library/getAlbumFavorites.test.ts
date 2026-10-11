import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { albumKeyOf } from "../../shared/albumKeyOf";
import { runMigrations } from "../db/runMigrations";
import { getAlbumFavorites } from "./getAlbumFavorites";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

/** Insert a favorite row directly (no tracks needed for the read side). */
const favorite = (artist: string, album: string): void => {
  db.prepare("INSERT INTO album_favorites (artist, album) VALUES (?, ?)").run(
    artist,
    album,
  );
};

it("returns an empty list when no album is a favorite", () => {
  expect(getAlbumFavorites(db)).toEqual([]);
});

it("returns every favorite as an album identity key", () => {
  favorite("B Artist", "Album");
  favorite("A Artist", "Second");
  favorite("A Artist", "First");

  expect(getAlbumFavorites(db)).toEqual([
    "A Artist\u0000First",
    "A Artist\u0000Second",
    "B Artist\u0000Album",
  ]);
});

it("builds the keys with albumKeyOf, empty halves included", () => {
  favorite("", "Demos");
  favorite("Artist", "");
  expect(getAlbumFavorites(db)).toEqual([
    albumKeyOf("", "Demos"),
    albumKeyOf("Artist", ""),
  ]);
});
