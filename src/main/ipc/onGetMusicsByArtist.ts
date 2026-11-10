import { getDatabase } from "../db/connection";
import { getMusicsByArtist } from "../library/getMusicsByArtist";
import { markStartupOnce } from "../startupTrace";
import type { GetMusicsByArtistRequest, IpcResult, Music } from "./types";
import { toIpcError } from "./utils/toIpcError";

/**
 * Channel handler for `mp:library:getMusicsByArtist`.
 *
 * @param _ev - Electron event object (unused).
 * @param request - Artist name from the sidebar list.
 * @returns Every track of the artist.
 */
export const onGetMusicsByArtist = async (
  _ev: Electron.IpcMainInvokeEvent,
  request: GetMusicsByArtistRequest,
): Promise<IpcResult<readonly Music[]>> => {
  markStartupOnce("main:get-artist-musics-start");
  try {
    return {
      ok: true,
      value: getMusicsByArtist(getDatabase(), request?.artist ?? ""),
    };
  } catch (error) {
    return { ok: false, error: toIpcError(error) };
  } finally {
    markStartupOnce("main:get-artist-musics-end");
  }
};
