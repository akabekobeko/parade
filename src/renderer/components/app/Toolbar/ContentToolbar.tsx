import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { ColumnsMenu } from "./ColumnsMenu";
import { FilterMenu } from "./FilterMenu";
import { ToolbarIconCluster } from "./ToolbarIconCluster";
import { useContentToolbar } from "./useContentToolbar";

/**
 * Title-bar-height band on top of the content area
 * (`docs/specs/v1.0/renderer/routing-layout.md`). The background is a window
 * drag region; on Windows / Linux the Window Controls Overlay occupies the
 * band's right corner, so the right padding
 * (`--content-toolbar-inset-right`) keeps everything right-aligned about
 * one character clear of it. While the sidebar is closed its icon cluster
 * moves here, keeping every icon's screen position across the toggle. The
 * song filter input and the filter menu to its left show only on routes
 * with a track list, and the columns menu left of those only in the
 * Playlists section (`useContentToolbar`).
 */
export const ContentToolbar = () => {
  const t = useT();
  const { sidebar, filter, columns } = useContentToolbar();

  return (
    <div className="app-region-drag flex h-(--toolbar-height) shrink-0 items-center gap-2 pr-(--content-toolbar-inset-right)">
      {!sidebar.open && (
        <ToolbarIconCluster
          className="shrink-0"
          style={{ width: sidebar.width }}
        />
      )}
      <div className="min-w-0 flex-1" />
      {columns !== null && (
        <ColumnsMenu
          items={columns.items}
          resettable={columns.resettable}
          onToggle={columns.toggle}
          onReset={columns.reset}
        />
      )}
      {filter !== null && (
        <FilterMenu
          favoriteOnly={filter.favoriteOnly}
          active={filter.active}
          onFavoriteOnlyChange={filter.setFavoriteOnly}
        />
      )}
      {filter !== null && (
        <Input
          type="search"
          value={filter.text}
          placeholder={t("toolbar.filterSongs")}
          aria-label={t("toolbar.filterSongs")}
          className="app-region-no-drag h-7 w-56 shrink"
          onChange={(event) => {
            filter.setText(event.target.value);
          }}
        />
      )}
    </div>
  );
};
