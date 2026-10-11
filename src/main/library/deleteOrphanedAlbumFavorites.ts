import type { DatabaseSync } from "node:sqlite";
import { ALBUM_ARTIST_SQL } from "./constants";

/**
 * Drop `album_favorites` rows whose album (display artist + album name, the
 * album identity) no longer has any track, so a favorite never outlives the
 * album it was set for (`docs/specs/v1.4/architecture/database.md`).
 *
 * Runs inside the caller's transaction — this function never opens or
 * commits one itself. Sibling of `deleteOrphanedArtistInitials`; every
 * mutation that can remove or re-key tracks (removal, re-import, tag edit)
 * runs it, after any favorite inheritance of the same transaction so the
 * old key is only dropped once its tracks are really gone.
 *
 * @param db - The open library connection.
 */
export const deleteOrphanedAlbumFavorites = (db: DatabaseSync): void => {
  db.prepare(
    `DELETE FROM album_favorites
     WHERE (artist, album) NOT IN (SELECT ${ALBUM_ARTIST_SQL}, m.album FROM musics m)`,
  ).run();
};
