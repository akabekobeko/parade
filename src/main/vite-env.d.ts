/// <reference types="vite/client" />

/**
 * Build-time constant of `src/main/vite.config.ts`: `true` only in
 * `vite build --mode trace` (`pnpm build:trace`), which compiles the startup
 * trace in (README "Startup Trace"). vitest defines it as `false`.
 */
declare const __STARTUP_TRACE__: boolean;

/**
 * Vite `?raw` imports used by the Main process (migration SQL files).
 * Both Vite and vitest resolve these natively; this declaration only informs
 * `tsc`.
 */
declare module "*.sql?raw" {
  const content: string;
  export default content;
}
