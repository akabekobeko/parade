import { getDatabase } from "../db/connection";
import { getArtists } from "../library/artistQueries";
import { markStartupOnce } from "../startupTrace";
import type { Artist, IpcResult } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:getArtists`.
 *
 * @param _ev - Electron event object (unused).
 * @returns Every artist with track count and artwork path.
 */
export const onGetArtists = async (
  _ev: Electron.IpcMainInvokeEvent,
): Promise<IpcResult<readonly Artist[]>> => {
  markStartupOnce("main:get-artists-start");
  try {
    return { ok: true, value: getArtists(getDatabase()) };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  } finally {
    markStartupOnce("main:get-artists-end");
  }
};
