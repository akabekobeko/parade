import type { DatabaseSync } from "node:sqlite";
import type { PlaylistKind } from "../ipc/types";
import { deleteOrphanedPictures } from "../library/deleteOrphanedPictures";
import { assertPlaylistExists } from "./assertPlaylistExists";
import { TABLE_OF } from "./constants";

/**
 * Set (or replace) a playlist's picture
 * (`docs/specs/v1.6/architecture/database.md`).
 *
 * The UPDATE and the picture GC run in one transaction, so a picture
 * orphaned by the swap is dropped unless a track, an artist or another
 * playlist still references it. `updated_at` moves too: the picture is an
 * attribute of the playlist itself, like its name.
 *
 * @param db - The open library connection.
 * @param ref - Target playlist (id within the table of `kind`).
 * @param pictureId - Picture row to reference.
 * @param now - ISO-8601 timestamp for updated_at.
 * @returns Artwork file paths whose rows were GC'd — the caller deletes the
 *   files after the transaction committed.
 */
export const setPlaylistPicture = (
  db: DatabaseSync,
  ref: { readonly id: number; readonly kind: PlaylistKind },
  pictureId: number,
  now: string,
): string[] => {
  assertPlaylistExists(db, ref.kind, ref.id);
  db.exec("BEGIN");
  try {
    db.prepare(
      `UPDATE ${TABLE_OF[ref.kind]} SET picture_id = ?, updated_at = ? WHERE id = ?`,
    ).run(pictureId, now, ref.id);
    const orphaned = deleteOrphanedPictures(db);
    db.exec("COMMIT");
    return orphaned;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};
