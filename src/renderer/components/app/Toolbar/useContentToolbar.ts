import { useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import { sectionOf } from "@/features/layout/sectionOf";
import { sidebarStore } from "@/features/layout/sidebarStore";
import { PLAYLIST_COLUMNS } from "@/features/playlistColumns/constants";
import { isDefaultPlaylistColumns } from "@/features/playlistColumns/isDefaultPlaylistColumns";
import { playlistColumnsStore } from "@/features/playlistColumns/playlistColumnsStore";
import type { PlaylistColumnId } from "@/features/playlistColumns/types";
import { isContentFilterActive } from "@/features/trackFilter/isContentFilterActive";
import { trackFilterStore } from "@/features/trackFilter/trackFilterStore";
import type { ColumnsMenuItem } from "./ColumnsMenu";

/**
 * Logic of `ContentToolbar`: the sidebar snapshot (the icon cluster moves
 * here while the sidebar is closed), the filters of the active route's
 * section — the song filter's draft text, the filter menu's "favorites
 * only" toggle, whether either narrows the view, and their change handlers
 * — or `null` when the route has no track list, and the columns menu of
 * the Playlist table — its entries and the toggle / reset handlers — or
 * `null` outside the Playlists section. The menu shows whether or not a
 * playlist is selected, so the toolbar layout does not shift with the
 * selection.
 */
export const useContentToolbar = () => {
  const sidebar = useSyncExternalStore(
    sidebarStore.subscribe,
    sidebarStore.getSnapshot,
  );
  const { draft, favoriteOnly } = useSyncExternalStore(
    trackFilterStore.subscribe,
    trackFilterStore.getSnapshot,
  );
  const columnsState = useSyncExternalStore(
    playlistColumnsStore.subscribe,
    playlistColumnsStore.getSnapshot,
  );
  const { pathname } = useLocation();
  const section = sectionOf(pathname);

  const filter =
    section === null
      ? null
      : {
          text: draft[section],
          favoriteOnly: favoriteOnly[section],
          // The Funnel fills as soon as the text is typed (the draft), not
          // when the debounced value reaches the views.
          active: isContentFilterActive({
            text: draft[section],
            favoriteOnly: favoriteOnly[section],
          }),
          setText: (text: string): void => {
            trackFilterStore.setText(section, text);
          },
          setFavoriteOnly: (value: boolean): void => {
            trackFilterStore.setFavoriteOnly(section, value);
          },
        };

  const columns =
    section !== "playlists"
      ? null
      : {
          items: PLAYLIST_COLUMNS.flatMap((column): ColumnsMenuItem[] =>
            column.pinned || column.labelKey === null
              ? []
              : [
                  {
                    id: column.id,
                    labelKey: column.labelKey,
                    visible: columnsState.visibleIds.includes(column.id),
                  },
                ],
          ),
          resettable: !isDefaultPlaylistColumns(columnsState),
          toggle: (columnId: PlaylistColumnId, visible: boolean): void => {
            playlistColumnsStore.dispatch({
              type: "visibilityChanged",
              columnId,
              visible,
            });
          },
          reset: (): void => {
            playlistColumnsStore.dispatch({ type: "reset" });
          },
        };

  return { sidebar, filter, columns };
};
