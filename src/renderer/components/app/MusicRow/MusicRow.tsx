import type { Music } from "@mp/ipc";
import type { MouseEvent, ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { formatTime } from "@/libs/formatTime";
import { cn } from "@/libs/utils";
import { EllipsisText } from "../EllipsisText/EllipsisText";
import {
  FavoriteStarButton,
  INVERSE_STAR_CLASS_NAME,
} from "../FavoriteStarButton/FavoriteStarButton";
import { RowMenu, type RowMenuItems } from "../RowMenu/RowMenu";
import { RowMenuEntries } from "../RowMenu/RowMenuItems";
import { PausedButton } from "./PausedButton";
import { PlayingButton } from "./PlayingButton";
import { TrackNumberButton } from "./TrackNumberButton";

/** Row height in px — shared with virtualizers embedding these rows. */
export const MUSIC_ROW_HEIGHT = 36;

type Props = {
  /** The track this row shows: title, duration, and track number. */
  readonly music: Music;
  /**
   * Number shown in the leading cell instead of the track number (the
   * Playlist view shows the 1-based position — position is the entry's
   * identity there, not the track).
   */
  readonly ordinal?: number;
  /**
   * Extra middle columns between the title and the duration (e.g. the
   * Playlist view's artist / album). The slot keeps the row layout-agnostic.
   */
  readonly columns?: ReactNode;
  /** Non-null when this is the current track ("playing" / "paused"). */
  readonly playing?: "playing" | "paused" | null;
  /** Whether the row is part of the multi-selection; defaults to `false`. */
  readonly selected?: boolean;
  /** Selection handler (click; Shift / Cmd arrive via the event). */
  readonly onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Start playback from this track (hover play button / double-click). */
  readonly onPlay?: () => void;
  /**
   * Toggle play / pause of the current track (the current row's hover pause /
   * play button — the play button resumes from the paused position, unlike `onPlay`).
   */
  readonly onTogglePlayPause?: () => void;
  /**
   * The Star was clicked: flip the track's favorite to `next`
   * (`docs/specs/v1.4/features/music-favorite.md`). The parent runs the IPC
   * and the cache update; the row only shows `music.favorite`.
   */
  readonly onToggleFavorite: (next: boolean) => void;
  /**
   * Per-track menu entries (#43), shown by the [...] dropdown and by the
   * row's right-click menu alike.
   */
  readonly menuItems: RowMenuItems;
};

/**
 * Classes for the row container. The hovered and the selected row show the
 * rounded accent rectangle, as does the row whose right-click menu is open
 * (`data-popup-open`, set by the context-menu trigger) so the menu's target
 * stays visible while the pointer is inside the menu. The playing / paused
 * row is filled with `foreground` like the selected sidebar row, whatever
 * its selection or hover, and its texts and icons take the inverse colour
 * (`background`; see the leading cell, the title, the duration, the Star,
 * and the menu). The fills switch without a transition: an eased one
 * flickered.
 * Every row keeps a transparent border so the content sits where it did
 * when the border carried a highlight.
 * Contiguous selected rows merge into one rounded rectangle like Apple
 * Music: a selected row squares off the corners it shares with a selected
 * neighbour (`selected-above` / `selected-below` in `App.css` look at the
 * sibling row or, in virtualised lists, the sibling wrapper). The playing
 * row stays out of that merge (it neither squares its corners nor counts as
 * a selected neighbour, see `data-selected`): its `foreground` slab would
 * otherwise be cut flush into the `accent` block.
 */
const rowClassName = (playing: boolean, selected: boolean): string =>
  cn(
    "group flex h-9 w-full flex-row items-center gap-2 rounded-md border border-transparent px-2 text-sm",
    playing
      ? "bg-foreground text-background"
      : selected
        ? "bg-accent text-accent-foreground"
        : "hover:bg-accent/50 data-popup-open:bg-accent/50",
    selected &&
      !playing &&
      "selected-above:rounded-t-none selected-below:rounded-b-none",
  );

/**
 * One track row shared by the Artist / Album / Playlist views
 * (`docs/specs/v1.0/features/artist-view.md`): track number / title /
 * duration / menu slot, with receptacles for the playing highlight,
 * selection, and playback wiring (#43 / later views).
 *
 * A row, not a list: the views own their (virtualized) list structure and
 * render one `MusicRow` per item, so the shared piece stays layout-agnostic.
 * The title is a real `<button>` (click = select, double-click = play,
 * Enter = select), keeping the container itself non-interactive. The button
 * also holds the extra columns and the duration and stretches to the row
 * height, so a click anywhere between the leading cell and the menu lands on
 * it; only the leading cell (play / pause) and the menu keep their own
 * controls, so opening the menu never resets a multi-selection.
 *
 * The menu entries render twice: in the [...] dropdown (`RowMenu`) and in
 * the right-click menu of the whole row (`ContextMenu`, the row itself is
 * the trigger element so the sibling-based selection styling still sees
 * rows next to each other). Both act on the same targets, so right-clicking
 * a row of the multi-selection addresses the selection like its [...] does.
 *
 * The leading cell doubles as the playback indicator / control (Apple Music
 * style), picked by `playing`: `PlayingButton` for the playing row,
 * `PausedButton` for the paused row, `TrackNumberButton` for any other
 * (stopped) row. Left of it sits the favorite Star (`FavoriteStarButton`),
 * always visible; like the leading cell it lies outside the title button,
 * so a click on it never selects or plays the row, and the row height is
 * unchanged. The playing / paused row is filled with `foreground` (see
 * `rowClassName`), so its Star and menu are `inverse` like the selected
 * sidebar row's menu.
 */
export const MusicRow = ({
  music,
  ordinal,
  columns,
  playing = null,
  selected = false,
  onClick,
  onPlay,
  onTogglePlayPause,
  onToggleFavorite,
  menuItems,
}: Props) => {
  const number =
    ordinal !== undefined ? ordinal : music.track > 0 ? music.track : "-";
  const current = playing !== null;

  const cells = (
    <>
      <FavoriteStarButton
        className={cn("shrink-0", current && INVERSE_STAR_CLASS_NAME)}
        favorite={music.favorite}
        onToggle={onToggleFavorite}
      />
      <span className="flex w-7 shrink-0 items-center justify-end font-mono text-muted-foreground text-xs tabular-nums">
        {playing === "playing" ? (
          <PlayingButton onPause={onTogglePlayPause} />
        ) : playing === "paused" ? (
          <PausedButton onResume={onTogglePlayPause} />
        ) : (
          <TrackNumberButton
            number={number}
            title={music.title}
            onPlay={onPlay}
          />
        )}
      </span>
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-default items-center gap-2 self-stretch pl-1 text-left outline-none"
        onClick={onClick}
        onDoubleClick={onPlay}
      >
        <EllipsisText
          className={cn("min-w-0 flex-1", current && "font-medium")}
          text={music.title}
        />
        {columns}
        <span
          className={cn(
            "shrink-0 font-mono text-xs tabular-nums",
            current ? "text-background/70" : "text-muted-foreground",
          )}
        >
          {formatTime(music.durationMs / 1000)}
        </span>
      </button>
      <span className="shrink-0">
        <RowMenu variant="ring" inverse={current} items={menuItems} />
      </span>
    </>
  );

  return (
    <ContextMenu>
      <ContextMenuTrigger
        data-selected={(selected && !current) || undefined}
        className={rowClassName(current, selected)}
      >
        {cells}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <RowMenuEntries items={menuItems} />
      </ContextMenuContent>
    </ContextMenu>
  );
};
