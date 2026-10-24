import type { DatabaseSync } from "node:sqlite";
import type { PlaylistRemoveRequest } from "../ipc/types";
import { deleteOrphanedPictures } from "../library/deleteOrphanedPictures";
import { assertPlaylistExists } from "./assertPlaylistExists";
import { TABLE_OF } from "./constants";

/**
 * Delete a playlist (`mp:playlist:remove`). Static playlist rows cascade to
 * `playlist_musics`.
 *
 * The DELETE and the picture GC run in one transaction
 * (`docs/specs/v1.6/architecture/database.md`): a picture the removed
 * playlist referenced is dropped unless a track, an artist or another
 * playlist still uses it.
 *
 * @param db - The open library connection.
 * @param request - Target id and kind.
 * @returns Artwork file paths whose rows were GC'd — the caller deletes the
 *   files after the transaction committed.
 */
export const removePlaylist = (
  db: DatabaseSync,
  request: PlaylistRemoveRequest,
): string[] => {
  assertPlaylistExists(db, request.kind, request.id);
  db.exec("BEGIN");
  try {
    db.prepare(`DELETE FROM ${TABLE_OF[request.kind]} WHERE id = ?`).run(
      request.id,
    );
    const orphaned = deleteOrphanedPictures(db);
    db.exec("COMMIT");
    return orphaned;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
};
