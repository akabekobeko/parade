import { z } from "zod";
import { smartPlaylistRulesSchema } from "../../shared/schemas/smartPlaylistRulesSchema";

/**
 * Columns shared by the `playlists` and `smart_playlists` SELECTs
 * (`docs/specs/v1.6/architecture/database.md`).
 */
export const playlistRowSchema = z.object({
  /** Row id; unique only within the table the SELECT ran against. */
  id: z.number().int(),
  /** User-given name; not unique. */
  name: z.string(),
  /** `sort_order` column: position within the kind's list, ascending. */
  sortOrder: z.number().int(),
  /**
   * `pictures.file_path` joined through `picture_id`; `null` when the
   * playlist has no picture.
   */
  picturePath: z.string().nullable(),
});

/**
 * Row of the `playlists` SELECTs. The track count is a subquery over
 * `playlist_musics`; a smart playlist's count is computed by evaluating its
 * rules instead, so it is not part of {@link smartPlaylistRowSchema}.
 */
export const staticPlaylistRowSchema = playlistRowSchema.extend({
  /** `COUNT(*)` of the playlist's `playlist_musics` rows (duplicates counted). */
  musicCount: z.number().int(),
});

/**
 * Stored rule JSON of `smart_playlists.rules`, decoded and validated in one
 * step so a corrupted document surfaces as a parse issue instead of reaching
 * the SQL builder.
 */
export const smartPlaylistRulesJsonSchema = z
  .string()
  .transform((text, ctx): unknown => {
    try {
      return JSON.parse(text);
    } catch (error) {
      ctx.addIssue({
        code: "custom",
        message: `rules is not valid JSON: ${String(error)}`,
      });
      return z.NEVER;
    }
  })
  .pipe(smartPlaylistRulesSchema);

/** Row of the `smart_playlists` SELECTs with the rules decoded. */
export const smartPlaylistRowSchema = playlistRowSchema.extend({
  /** `rules` column, decoded from JSON and validated in one step. */
  rules: smartPlaylistRulesJsonSchema,
});
