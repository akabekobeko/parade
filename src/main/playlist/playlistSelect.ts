/**
 * SELECT statements shared by `listPlaylists` and `readPlaylist`
 * (`docs/specs/v1.6/architecture/database.md`), so both return the same
 * `Playlist` shape. Each takes the table alias `x`; callers append the
 * `WHERE` / `ORDER BY` clause.
 */

/**
 * Rows of {@link import("./playlistRowSchema").staticPlaylistRowSchema}:
 * picture path through `pictures`, entry count over `playlist_musics`.
 */
export const STATIC_PLAYLIST_SELECT = `
  SELECT x.id, x.name, x.sort_order AS sortOrder, p.file_path AS picturePath,
         (SELECT COUNT(*) FROM playlist_musics pm WHERE pm.playlist_id = x.id) AS musicCount
  FROM playlists x
  LEFT JOIN pictures p ON p.id = x.picture_id`;

/**
 * Rows of {@link import("./playlistRowSchema").smartPlaylistRowSchema} with
 * the rules still encoded; the track count is computed from the decoded
 * rules by `countSmartPlaylistMusics`.
 */
export const SMART_PLAYLIST_SELECT = `
  SELECT x.id, x.name, x.sort_order AS sortOrder, p.file_path AS picturePath, x.rules
  FROM smart_playlists x
  LEFT JOIN pictures p ON p.id = x.picture_id`;
