import { useEffect, useLayoutEffect } from "react";

/**
 * Renderer side of the startup trace (`src/main/startupTrace.ts`, README
 * "Startup Trace").
 *
 * Compiled in only by `pnpm build:trace`, which defines `__STARTUP_TRACE__`
 * as `true` for the Renderer bundle as well. Marks are emitted as console
 * messages of the form `[startup] <label> <epochMs>`, which the main process
 * parses and prints once per label (so a repeated event here, a refetch or a
 * remount, is harmless); keep the two sides in sync.
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

/**
 * Mark the commit in which `ready` is true as `<label>-committed`, and the
 * moment the browser has painted it as `<label>-painted`.
 *
 * The commit stamp runs in a layout effect, which React flushes before the
 * browser paints (a passive effect may run after the paint for non-discrete
 * renders). The paint stamp runs in a task queued from the next animation
 * frame: the frame callback precedes that frame's paint, so a zero-delay
 * timer from inside it lands right after. An unmount or a `ready` flip
 * before the paint cancels the pending stamp; the next ready commit arms it
 * again, and the main process keeps the first arrival.
 *
 * @param label - Prefix such as `renderer:artist-list`.
 * @param ready - Whether the content the label stands for is on screen.
 */
export const useStartupMarkWhen = (label: string, ready: boolean): void => {
  useLayoutEffect(() => {
    if (!__STARTUP_TRACE__ || !ready) return;
    markStartup(`${label}-committed`);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const frame = requestAnimationFrame(() => {
      timer = setTimeout(() => {
        markStartup(`${label}-painted`);
      }, 0);
    });
    return () => {
      cancelAnimationFrame(frame);
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [label, ready]);
};

/**
 * Marks the first React commit (`renderer:react-committed`), the end of its
 * passive effects (`renderer:react-effects-flushed`; rendered last next to
 * `App`, so the siblings' effects have run by then) and its paint
 * (`renderer:react-painted`).
 */
export const StartupMark = (): null => {
  useStartupMarkWhen("renderer:react", true);
  useEffect(() => {
    markStartup("renderer:react-effects-flushed");
  }, []);
  return null;
};
