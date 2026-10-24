-- Playlist pictures (docs/specs/v1.6/architecture/database.md).
-- Both playlist tables reference a `pictures` row like `artist_pictures`
-- does; NULL means the playlist has no picture. A picture referenced only
-- by playlists is kept by the orphan GC, and dropped once no playlist
-- references it any more.
-- Applied files must never change; schema changes go into new numbered files.

ALTER TABLE playlists       ADD COLUMN picture_id INTEGER REFERENCES pictures(id);
ALTER TABLE smart_playlists ADD COLUMN picture_id INTEGER REFERENCES pictures(id);
