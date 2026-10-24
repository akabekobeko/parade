import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, expect, it } from "vitest";
import { runMigrations } from "../db/runMigrations";
import { deleteOrphanedPictures } from "./deleteOrphanedPictures";
import { getOrCreatePictureId } from "./getOrCreatePictureId";
import { registerArtistPictureIfMissing } from "./registerArtistPictureIfMissing";

let db: DatabaseSync;

beforeEach(() => {
  db = new DatabaseSync(":memory:");
  runMigrations(db);
});

afterEach(() => {
  db.close();
});

const count = (): number =>
  (db.prepare("SELECT COUNT(*) AS n FROM pictures").get() as { n: number }).n;

/** Insert a playlist row of `table` that references `pictureId` (or nothing). */
const insertPlaylist = (
  table: "playlists" | "smart_playlists",
  pictureId: number | null,
): void => {
  if (table === "playlists") {
    db.prepare(
      `INSERT INTO playlists (name, sort_order, picture_id, created_at, updated_at)
       VALUES ('P', 0, ?, '', '')`,
    ).run(pictureId);
  } else {
    db.prepare(
      `INSERT INTO smart_playlists (name, rules, sort_order, picture_id, created_at, updated_at)
       VALUES ('S', '{}', 0, ?, '', '')`,
    ).run(pictureId);
  }
};

it("returns an empty list when no picture is orphaned", () => {
  const pictureId = getOrCreatePictureId(db, "/images/used.jpg");
  registerArtistPictureIfMissing(db, "Artist", pictureId);
  expect(deleteOrphanedPictures(db)).toEqual([]);
  expect(count()).toBe(1);
});

it("deletes unreferenced pictures and returns their paths", () => {
  getOrCreatePictureId(db, "/images/orphan.jpg");
  const keptId = getOrCreatePictureId(db, "/images/kept.jpg");
  registerArtistPictureIfMissing(db, "Artist", keptId);

  expect(deleteOrphanedPictures(db)).toEqual(["/images/orphan.jpg"]);
  expect(count()).toBe(1);
});

it.each(["playlists", "smart_playlists"] as const)(
  "keeps a picture referenced only by a row of %s until the reference is gone",
  (table) => {
    const pictureId = getOrCreatePictureId(db, "/images/playlist.jpg");
    insertPlaylist(table, pictureId);
    // A playlist without a picture must not shadow the orphan check.
    insertPlaylist(table, null);

    expect(deleteOrphanedPictures(db)).toEqual([]);
    expect(count()).toBe(1);

    db.prepare(`UPDATE ${table} SET picture_id = NULL`).run();
    expect(deleteOrphanedPictures(db)).toEqual(["/images/playlist.jpg"]);
    expect(count()).toBe(0);
  },
);
