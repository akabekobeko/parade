import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CircleIconButton } from "../Buttons/CircleIconButton";
import { IconButton } from "../Buttons/IconButton";
import { RowMenuEntries, type RowMenuItems } from "./RowMenuItems";

export type { RowMenuItem, RowMenuItems } from "./RowMenuItems";

type Props = {
  /**
   * Entries in display order: plain items, or ready-made menu elements
   * (e.g. `AddToPlaylistSubmenu`) rendered as given and keyed by position.
   */
  readonly items: RowMenuItems;
  /**
   * Trigger look. "tint" (default): `IconButton` with the rounded fill on
   * hover, for the narrow sidebar rows. "ring": `IconButton` with the
   * circle border and glow on hover, for the track rows, where the trigger
   * sits at the row's end with room around it. "circle": the always
   * bordered `CircleIconButton` of the list and album headers.
   */
  readonly variant?: "tint" | "ring" | "circle";
  /**
   * Whether the trigger rests on a `foreground` fill (the selected sidebar
   * row, the playing track row) and takes the inverse colours, or
   * "group-hover" for a row filled only while hovered (`IconButton`'s
   * `inverse`). Ignored by "circle".
   */
  readonly inverse?: boolean | "group-hover";
  /** Extra classes of the trigger button (e.g. a row's show / hide rules). */
  readonly className?: string;
};

/**
 * The [...] dropdown shared by list headers, album sections, and track rows
 * (Artist / Album / Playlist views). Promoted out of the Artist page when
 * the Album view became its second consumer.
 *
 * Entries are plain items or ready-made menu elements — the latter lets
 * views splice in composite pieces like the "Add to playlist ▸" submenu.
 * The entries themselves render through `RowMenuEntries`, shared with the
 * track rows' right-click menu (`MusicRow`).
 */
export const RowMenu = ({
  items,
  variant = "tint",
  inverse = false,
  className,
}: Props) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        variant === "circle" ? (
          <CircleIconButton aria-label="Menu" className={className} />
        ) : (
          <IconButton
            variant={variant}
            inverse={inverse}
            aria-label="Menu"
            className={className}
          />
        )
      }
    >
      <MoreHorizontal />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <RowMenuEntries items={items} />
    </DropdownMenuContent>
  </DropdownMenu>
);
