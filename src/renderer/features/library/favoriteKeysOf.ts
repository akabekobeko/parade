import type { FetchState } from "./queryStore/types";

/**
 * The favorite album keys a view should show for one fetch state of the
 * `albumFavorites` query (`useAlbumFavorites`): the loaded list, or, while a
 * reload is in flight or has failed, the list last loaded. The library
 * broadcast invalidates every key after an import or a tag write; keeping
 * the previous list over that reload stops the Stars blinking off and on,
 * and keeps an open info dialog on its initial value.
 *
 * @param state - Current fetch state of the query.
 * @param previous - The list last handed out (empty before the first load).
 * @returns The list to show.
 */
export const favoriteKeysOf = (
  state: FetchState<readonly string[]>,
  previous: readonly string[],
): readonly string[] => (state.status === "success" ? state.value : previous);
