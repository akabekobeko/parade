import { APP_VERSION } from "../appVersion";
import type { IpcResult, Versions } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:app:getVersions`.
 *
 * Combines the app's own version ({@link APP_VERSION}, a build-time
 * constant) with `process.versions` for the about display.
 *
 * @param _ev - Electron event object (unused).
 * @returns A snapshot of the runtime stack versions.
 */
export const onGetVersions = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<Versions>> => {
  try {
    return {
      ok: true,
      value: {
        app: APP_VERSION,
        electron: process.versions.electron ?? "",
        chrome: process.versions.chrome ?? "",
        node: process.versions.node,
      },
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
