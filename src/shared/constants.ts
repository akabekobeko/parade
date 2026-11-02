/**
 * Constants referenced as values from both the Main and Renderer processes.
 *
 * Keep this file dependency-free: only values that both tsconfig projects can
 * compile (no Node / DOM APIs) belong here.
 */

/** Display name of the application. */
export const APP_NAME = "Parade";

/**
 * Custom protocol scheme streaming audio files to the Renderer.
 * Used by `<audio src>` only (no `supportFetchAPI` privilege).
 */
export const PROTOCOL_MEDIA_STREAM = "media-stream";

/**
 * Custom protocol scheme serving artwork images: `<img src>`, plus `fetch`
 * for the MediaSession artwork Blob URL.
 */
export const PROTOCOL_MEDIA_FILE = "media-file";

/**
 * File extension per supported image MIME type.
 *
 * Shared by both processes: Main derives artwork file names from it
 * (`artworkFileName`) and accept-lists user-selected images
 * (`onSetArtistPicture`, `mp:library:updateMusics`); Renderer rejects an
 * unsupported pick before it travels over IPC (music info dialog).
 */
export const IMAGE_EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
};

/** Lower bound of the playback rate (not a quality guarantee below 0.5). */
export const PLAYBACK_RATE_MIN = 0.25;

/** Upper bound of the playback rate. */
export const PLAYBACK_RATE_MAX = 2;

/**
 * Granularity of the playback rate: slider steps and the +/- buttons move
 * by it, and `clampPlaybackRate` rounds every value onto this grid.
 */
export const PLAYBACK_RATE_STEP = 0.05;

/**
 * Preset rates offered by the speed popover. Finer around 1x where music
 * listening lives; nothing above 2x (little use for music).
 */
export const PLAYBACK_RATE_PRESETS: readonly number[] = [
  0.5, 0.75, 1, 1.25, 1.5, 2,
];
