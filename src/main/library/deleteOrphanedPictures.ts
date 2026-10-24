import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { idRowSchema } from "../db/idRowSchema";

/** Row of the orphan lookup below. */
const orphanRowSchema = idRowSchema.extend({ file_path: z.string() });

/**
 * Drop `pictures` rows referenced by none of `musics.picture_id`,
 * `artist_pictures.picture_id`, `playlists.picture_id` and
 * `smart_playlists.picture_id`, collecting their file paths
 * (`docs/specs/v1.6/architecture/database.md`). A picture referenced only
 * by a playlist therefore survives the removal of its tracks or artist.
 *
 * Runs inside the caller's transaction — this function never opens or
 * commits one itself. The caller deletes the returned files only after the
 * transaction committed (a file is never removed while a row still
 * references it).
 *
 * @param db - The open library connection.
 * @returns Artwork file paths whose rows were GC'd.
 */
export const deleteOrphanedPictures = (db: DatabaseSync): string[] => {
  const orphans = orphanRowSchema.array().parse(
    db
      .prepare(
        `SELECT id, file_path FROM pictures
         WHERE id NOT IN (SELECT picture_id FROM musics WHERE picture_id IS NOT NULL)
           AND id NOT IN (SELECT picture_id FROM artist_pictures)
           AND id NOT IN (SELECT picture_id FROM playlists WHERE picture_id IS NOT NULL)
           AND id NOT IN (SELECT picture_id FROM smart_playlists WHERE picture_id IS NOT NULL)`,
      )
      .all(),
  );
  if (orphans.length > 0) {
    const ids = orphans.map(() => "?").join(", ");
    db.prepare(`DELETE FROM pictures WHERE id IN (${ids})`).run(
      ...orphans.map((orphan) => orphan.id),
    );
  }

  return orphans.map((orphan) => orphan.file_path);
};
