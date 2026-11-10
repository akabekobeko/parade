import { useEffect } from "react";

/**
 * Renderer side of the startup trace (`src/main/startupTrace.ts`, README
 * "Startup Trace").
 *
 * Compiled in only by `pnpm build:trace`, which defines `__STARTUP_TRACE__`
 * as `true` for the Renderer bundle as well. Marks are emitted as console
 * messages of the form `[startup] <label> <epochMs>`, which the main process
 * parses; keep the two sides in sync.
 */

/**
 * Emit a startup mark.
 *
 * @param label - Short identifier such as `renderer:render-called`.
 * @param at - Epoch ms of the event; defaults to now.
 */
export const markStartup = (label: string, at: number = Date.now()): void => {
  if (!__STARTUP_TRACE__) return;
  console.info(`[startup] ${label} ${Math.round(at)}`);
};

const emitted = new Set<string>();

/**
 * Emit a mark only the first time its label is seen, for events that recur
 * during the session (refetches, remounts) but only matter at startup.
 *
 * @param label - Short identifier.
 * @returns `true` when the mark was emitted by this call.
 */
export const markStartupOnce = (label: string): boolean => {
  if (!__STARTUP_TRACE__ || emitted.has(label)) return false;
  emitted.add(label);
  markStartup(label);
  return true;
};

/**
 * Mark the first commit in which `ready` is true as `<label>-committed`, and
 * the frame after it was painted as `<label>-painted` (two animation frames
 * later). Both marks are emitted once per label; an unmount before the paint
 * cancels the pending frames so no paint is recorded that never happened.
 *
 * @param label - Prefix such as `renderer:artist-list`.
 * @param ready - Whether the content the label stands for is on screen.
 */
export const useStartupMarkWhen = (label: string, ready: boolean): void => {
  useEffect(() => {
    if (!__STARTUP_TRACE__) return;
    if (!ready || !markStartupOnce(`${label}-committed`)) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        markStartupOnce(`${label}-painted`);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [label, ready]);
};

/**
 * Marks the first React commit (`renderer:react-committed`) and its paint
 * (`renderer:react-painted`). Rendered once next to `App`.
 */
export const StartupMark = (): null => {
  useStartupMarkWhen("renderer:react", true);
  return null;
};
