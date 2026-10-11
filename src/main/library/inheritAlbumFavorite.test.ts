import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { albumKeyOf } from "../../shared/albumKeyOf";
import { runMigrations } from "../db/runMigrations";
import { getAlbumFavorites } from "./getAlbumFavorites";
import { inheritAlbumFavorite } from "./inheritAlbumFavorite";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

/** Insert a favorite row directly; the inheritance itself needs no tracks. */
const favorite = (artist: string, album: string): void => {
  db.prepare("INSERT INTO album_favorites (artist, album) VALUES (?, ?)").run(
    artist,
    album,
  );
};

const OLD = { artist: "Artist", album: "Old" };
const NEW = { artist: "Artist", album: "New" };

it("turns the new key on when the old key is a favorite", () => {
  favorite(OLD.artist, OLD.album);

  inheritAlbumFavorite(db, OLD, NEW);

  // The old key stays; the orphan GC decides its fate.
  expect(getAlbumFavorites(db)).toEqual([
    albumKeyOf("Artist", "New"),
    albumKeyOf("Artist", "Old"),
  ]);
});

it("does nothing when the old key is not a favorite", () => {
  inheritAlbumFavorite(db, OLD, NEW);
  expect(getAlbumFavorites(db)).toEqual([]);
});

it("does nothing when the key did not change", () => {
  favorite(OLD.artist, OLD.album);
  inheritAlbumFavorite(db, OLD, OLD);
  expect(getAlbumFavorites(db)).toEqual([albumKeyOf("Artist", "Old")]);
});

it("keeps a single row when the new key is already a favorite", () => {
  favorite(OLD.artist, OLD.album);
  favorite(NEW.artist, NEW.album);

  expect(() => inheritAlbumFavorite(db, OLD, NEW)).not.toThrow();
  expect(getAlbumFavorites(db)).toHaveLength(2);
});

it("follows a display artist change as well as an album rename", () => {
  favorite("Artist", "Album");

  inheritAlbumFavorite(
    db,
    { artist: "Artist", album: "Album" },
    { artist: "Various", album: "Album" },
  );

  expect(getAlbumFavorites(db)).toContain(albumKeyOf("Various", "Album"));
});
