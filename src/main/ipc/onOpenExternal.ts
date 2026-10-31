import { openExternalHttps } from "../openExternalHttps";
import type { IpcResult, OpenExternalRequest } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:app:openExternal`.
 *
 * Opens a link from the renderer (about dialog: website, GitHub, music data
 * credits) in the default browser; anything but `https:` is refused
 * ({@link openExternalHttps}).
 *
 * @param _ev - Electron event object (unused).
 * @param request - The URL to open.
 * @returns `ok` once the browser has been asked to open it.
 */
export const onOpenExternal = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: OpenExternalRequest,
): Promise<IpcResult<void>> => {
  try {
    await openExternalHttps(request.url);
    return { ok: true, value: undefined };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  }
};
