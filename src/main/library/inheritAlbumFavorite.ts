import type { DatabaseSync } from "node:sqlite";

/** The album identity of one track: display artist and album name. */
export type AlbumIdentity = {
  /** Display artist (`album_artist` falling back to `artist`). */
  readonly artist: string;
  /** Album title as tagged. */
  readonly album: string;
};

/**
 * Carry a favorite over to a track's new album when a tag edit changed its
 * album identity (`docs/specs/v1.4/architecture/database.md`, "key
 * inheritance").
 *
 * When the old key is a favorite, the new key becomes one too
 * (`ON CONFLICT DO NOTHING`, so an already-favorite target is left alone).
 * An existing non-favorite target album therefore turns on: the tracks of
 * a favorite album moved there, and the user can turn it off again. The
 * old key is not touched here — the orphan GC of the same mutation drops
 * it once no track is left under it, and keeps it while some remain.
 *
 * Runs inside the caller's transaction. A no-op when the key did not
 * change or the old key is not a favorite.
 *
 * @param db - The open library connection.
 * @param from - Album identity before the edit.
 * @param to - Album identity after the edit.
 */
export const inheritAlbumFavorite = (
  db: DatabaseSync,
  from: AlbumIdentity,
  to: AlbumIdentity,
): void => {
  if (from.artist === to.artist && from.album === to.album) {
    return;
  }

  db.prepare(
    `INSERT INTO album_favorites (artist, album)
     SELECT ?, ? WHERE EXISTS (
       SELECT 1 FROM album_favorites WHERE artist = ? AND album = ?
     )
     ON CONFLICT DO NOTHING`,
  ).run(to.artist, to.album, from.artist, from.album);
};
