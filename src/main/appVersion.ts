/** `version` from package.json, injected at build time via Vite `define`. */
declare const __APP_VERSION__: string;

/**
 * The app's own version, shown in the about dialog and sent in the
 * MusicBrainz User-Agent.
 *
 * A build-time constant rather than `app.getVersion()`: Electron reads that
 * from the package.json of the app path, and an unpackaged run
 * (`electron dist/main/main.js`) has none there, so it falls back to
 * Electron's own version. `vitest.config.ts` defines the constant for tests.
 */
export const APP_VERSION: string = __APP_VERSION__;
