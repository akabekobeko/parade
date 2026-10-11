import type { DatabaseSync } from "node:sqlite";

/**
 * Turn one track's favorite flag on or off
 * (`mp:library:setMusicFavorite`, `docs/specs/v1.4/architecture/database.md`).
 *
 * A single UPDATE of `musics.favorite`; `updated_at` is left alone because
 * it records the last tag write and the flag is not a tag. The flag is
 * never written to the file.
 *
 * @param db - The open library connection.
 * @param musicId - Row id of the track.
 * @param favorite - New flag value.
 * @throws `NOT_FOUND` (as the error `code`) when no track has that id, so
 *   a stale Renderer row is reported instead of silently updating nothing.
 */
export const setMusicFavorite = (
  db: DatabaseSync,
  musicId: number,
  favorite: boolean,
): void => {
  const { changes } = db
    .prepare("UPDATE musics SET favorite = ? WHERE id = ?")
    .run(favorite ? 1 : 0, musicId);
  if (changes === 0) {
    throw Object.assign(new Error(`Music ${musicId} is not in the library.`), {
      code: "NOT_FOUND",
    });
  }
};
