/**
 * Command-line argument the main process appends to the renderer's
 * `process.argv` (via `webPreferences.additionalArguments`) when startup
 * tracing is on, so the preload can expose the flag to the Renderer.
 * See `src/main/startupTrace.ts`.
 */
export const STARTUP_TRACE_ARGUMENT = "--parade-startup-trace";
