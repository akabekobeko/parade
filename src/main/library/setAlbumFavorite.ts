import type { DatabaseSync } from "node:sqlite";
import { parseAlbumKey } from "../../shared/albumKeyOf";
import { deleteOrphanedAlbumFavorites } from "./deleteOrphanedAlbumFavorites";

/**
 * Turn one album's favorite on or off
 * (`mp:library:setAlbumFavorite`, `docs/specs/v1.4/architecture/database.md`).
 *
 * `album_favorites` holds a row per favorite album and nothing for the
 * others, like `artist_initials`: on is an idempotent INSERT, off a DELETE.
 * The orphan GC runs in the same transaction, so a row for an album whose
 * last track vanished in the meantime never survives the call (the UI can
 * only name albums it lists, but a removal in flight may have emptied one).
 *
 * The empty display artist is a valid key half: it is the unknown-artist
 * bucket, whose albums are listed like any other and can be favorites.
 *
 * @param db - The open library connection.
 * @param albumKey - Identity key from `AlbumSummary.albumKey` /
 *   `AlbumGroup.key` (`albumKeyOf`).
 * @param favorite - New flag value.
 * @throws When the key has no separator (not an album key).
 */
export const setAlbumFavorite = (
  db: DatabaseSync,
  albumKey: string,
  favorite: boolean,
): void => {
  const parts = parseAlbumKey(albumKey);
  if (parts === null) {
    throw new Error("Malformed album key: missing separator.");
  }

  db.exec("BEGIN");
  try {
    if (favorite) {
      db.prepare(
        "INSERT INTO album_favorites (artist, album) VALUES (?, ?) ON CONFLICT DO NOTHING",
      ).run(parts.artist, parts.album);
    } else {
      db.prepare(
        "DELETE FROM album_favorites WHERE artist = ? AND album = ?",
      ).run(parts.artist, parts.album);
    }

    deleteOrphanedAlbumFavorites(db);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};
