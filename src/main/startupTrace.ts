import type { BrowserWindow } from "electron";

/**
 * Startup timeline tracing for performance measurement (README "Startup
 * Trace").
 *
 * Compiled in only by `pnpm build:trace` (`vite build --mode trace`), which
 * defines `__STARTUP_TRACE__` as `true`; the regular build defines it as
 * `false`, so the bundler drops the bodies below and the mark calls in the
 * app become no-ops. The trace build is otherwise a production build, so
 * the numbers describe what ships.
 *
 * Every mark is printed as the elapsed wall-clock time since the OS created
 * the process, so the Electron and Node bootstrap shows up as the offset of
 * the first mark. Renderer marks arrive as console messages of the form
 * `[startup] <label> <epochMs>` (see `src/renderer/startupMark.tsx`) and are
 * printed on the same axis; they are delivered asynchronously, so they may
 * appear slightly out of order relative to the main-process marks.
 */

/**
 * Process creation time in epoch ms; falls back to module evaluation. The
 * Electron extension is absent under plain Node (vitest), hence the guard.
 */
const origin = __STARTUP_TRACE__
  ? ((typeof process.getCreationTime === "function"
      ? process.getCreationTime()
      : null) ?? Date.now())
  : 0;

/**
 * Print a startup mark.
 *
 * @param label - Short identifier such as `main:ready`.
 * @param at - Epoch ms of the event; defaults to now.
 */
export function markStartup(label: string, at: number = Date.now()): void {
  if (!__STARTUP_TRACE__) return;
  const elapsed = (at - origin).toFixed(0).padStart(6);
  console.log(`[startup] ${elapsed} ms  ${label}`);
}

const emitted = new Set<string>();

/**
 * Print a mark only the first time its label is seen, for handlers that run
 * again later in the session and for Renderer marks that a reload repeats.
 *
 * @param label - Short identifier such as `main:get-artists-start`.
 * @param at - Epoch ms of the event; defaults to now.
 * @returns `true` when the mark was printed by this call.
 */
export function markStartupOnce(
  label: string,
  at: number = Date.now(),
): boolean {
  if (!__STARTUP_TRACE__ || emitted.has(label)) return false;
  emitted.add(label);
  markStartup(label, at);
  return true;
}

// Runs when this module is evaluated, which main.ts arranges to be before any
// other import of its own.
markStartup("main:first-js");

const RENDERER_MARK = /^\[startup\] (\S+) (\d+(?:\.\d+)?)$/;

/**
 * Attach the window and page-load marks to a freshly created window. Must be
 * called before `loadFile` / `loadURL` so no event is missed. Only the first
 * load is recorded; reloads and in-page navigations print nothing.
 *
 * @param window - The main window.
 */
export function traceWindowStartup(window: BrowserWindow): void {
  if (!__STARTUP_TRACE__) return;
  const { webContents } = window;
  webContents.once("did-start-loading", () => {
    markStartup("renderer:did-start-loading");
  });
  webContents.once("dom-ready", () => {
    markStartup("renderer:dom-ready");
  });
  webContents.once("did-finish-load", () => {
    markStartup("renderer:did-finish-load");
  });
  window.once("ready-to-show", () => {
    markStartup("window:ready-to-show");
  });
  webContents.on("console-message", (details) => {
    const match = RENDERER_MARK.exec(details.message);
    const label = match?.[1];
    const at = match?.[2];
    if (label !== undefined && at !== undefined) {
      markStartupOnce(label, Number(at));
    }
  });
}
