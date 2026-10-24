import { cn } from "@/libs/utils";

/**
 * Classes of a sidebar list row (Artists and Playlists,
 * `docs/specs/v1.6/features/sidebar-rows.md`), without its positioning:
 * the artist list positions rows absolutely for the virtualiser, the
 * playlist list lays them out in flow.
 *
 * The selected row is filled with `foreground` and its text switches to
 * the inverse (`background`) to stay readable on the fill. Hover fills the
 * row the same way with `fill-hover`, the selected fill pulled about 70%
 * of the way (tuned per theme in `App.css`), and gives the text the same
 * inverse colour, so hover reads as a lighter preview of the selection.
 * Hovering the selected row changes nothing: the solid fill already marks
 * it. The fills switch without a transition: an eased one flickered.
 *
 * The row is a `div` (`group`) holding the picture-and-text `button` and the
 * `RowMenu`, so both fill as one row and no button nests in a button.
 *
 * @param selected - Whether the row is the one selected by the route.
 * @returns The class list.
 */
export const sidebarRowClassName = (selected: boolean): string =>
  cn(
    "group flex items-center gap-3 rounded-md px-2 text-left text-sm",
    selected
      ? "bg-foreground text-background"
      : "text-sidebar-foreground/80 hover:bg-fill-hover hover:text-background",
  );

/**
 * Classes of the second text line (song count) of a sidebar row. The muted
 * colour sinks into the row's fill, so the selected and the hovered row use
 * the inverse colour, toned down to keep it secondary.
 *
 * @param selected - Whether the row is selected.
 * @returns The class list.
 */
export const sidebarRowCountClassName = (selected: boolean): string =>
  cn(
    "block truncate text-[11px]",
    selected
      ? "text-background/70"
      : "text-muted-foreground group-hover:text-background/70",
  );

/**
 * Props of a sidebar row's menu trigger (`RowMenu`, `variant="ring"`),
 * spread onto it: the row decides the trigger's look in one place.
 *
 * The trigger is shown while the row is hovered, while it has keyboard
 * focus (`focus-visible`), and always on the selected row; it also stays
 * while its menu is open, when focus has moved into the portaled menu.
 * Closing the menu returns focus to the trigger; a plain `focus` rule would
 * then keep the trigger visible after the pointer left the row, so only a
 * keyboard-visible focus (which also draws the focus ring) keeps it shown.
 *
 * On the selected row the trigger is `inverse`; on any other row the hover
 * fill makes the row just as dark (or light), so the trigger takes the
 * inverse look while the row is hovered (`inverse="group-hover"`).
 *
 * @param selected - Whether the row is selected.
 * @returns The `inverse` and `className` props.
 */
export const sidebarRowMenuProps = (
  selected: boolean,
): { inverse: true | "group-hover"; className: string } => ({
  inverse: selected ? true : "group-hover",
  className: cn(
    "shrink-0",
    !selected &&
      "opacity-0 focus-visible:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100",
  ),
});
