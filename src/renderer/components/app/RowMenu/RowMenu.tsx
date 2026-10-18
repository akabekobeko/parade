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
   * Trigger look: the plain icon (default, `IconButton`) or an outlined
   * circle (`CircleIconButton`).
   */
  readonly variant?: "ghost" | "circle";
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
export const RowMenu = ({ items, variant = "ghost" }: Props) => (
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        variant === "circle" ? (
          <CircleIconButton aria-label="Menu" />
        ) : (
          <IconButton aria-label="Menu" />
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
