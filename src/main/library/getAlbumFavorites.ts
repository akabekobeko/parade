import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { albumKeyOf } from "../../shared/albumKeyOf";

/** Row shape of the `album_favorites` SELECT below. */
const albumFavoriteRowSchema = z.object({
  artist: z.string(),
  album: z.string(),
});

/**
 * Identity keys of every favorite album (`mp:library:getAlbumFavorites`).
 *
 * The keys are the same strings as `AlbumSummary.albumKey` / `AlbumGroup.key`
 * (`albumKeyOf`), so the Renderer matches them against its album lists
 * without another lookup. The table only holds the albums turned on, so the
 * result stays small even for a large library.
 *
 * @param db - The open library connection.
 * @returns The keys in a stable (artist, album) order.
 */
export const getAlbumFavorites = (db: DatabaseSync): string[] =>
  albumFavoriteRowSchema
    .array()
    .parse(
      db
        .prepare(
          "SELECT artist, album FROM album_favorites ORDER BY artist, album",
        )
        .all(),
    )
    .map((row) => albumKeyOf(row.artist, row.album));
