import { cn } from "@/libs/utils";

/**
 * Classes of a sidebar list row (Artists and Playlists,
 * `docs/specs/v1.6/features/sidebar-rows.md`), without its positioning:
 * the artist list positions rows absolutely for the virtualiser, the
 * playlist list lays them out in flow.
 *
 * Hover lights the border up with a blurred glow like the `Sidebar` tabs: a
 * 1px spread ring on top of the border plus the blur, so it reads as a
 * thicker, stronger lamp. The selected row is filled with the glow colour
 * (`foreground`) and keeps the plain border but no glow of its own: the
 * solid fill already marks it, and fill plus glow together looked overdone.
 * Hovering the selected row still gets the hover glow. Its text switches to
 * the inverse (`background`) to stay readable on the fill, and keeps that
 * inverse colour on hover, where the plain hover text colour would vanish
 * into the fill. The hovered row is raised (`z-[2]`) so its glow is not
 * covered by an opaque sibling painted after it (the artist list's initial
 * headings), while staying below that list's pinned heading copy (`z-10`).
 *
 * The row is a `div` (`group`) holding the picture-and-text `button` and the
 * `RowMenu`, so both light up as one row and no button nests in a button.
 *
 * @param selected - Whether the row is the one selected by the route.
 * @returns The class list.
 */
export const sidebarRowClassName = (selected: boolean): string =>
  cn(
    "group flex items-center gap-3 rounded-md border border-transparent px-2 text-left text-sm transition-[color,background-color,border-color,box-shadow] duration-200",
    "hover:z-[2] hover:border-foreground hover:text-sidebar-foreground",
    "hover:shadow-[0_0_0_1px_var(--foreground),0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)]",
    selected
      ? "border-foreground bg-foreground text-background hover:text-background"
      : "text-sidebar-foreground/80",
  );

/**
 * Classes of the second text line (song count) of a sidebar row. The muted
 * colour sinks into the selected row's foreground fill, so the selected row
 * uses the inverse colour, toned down to keep it secondary.
 *
 * @param selected - Whether the row is selected.
 * @returns The class list.
 */
export const sidebarRowCountClassName = (selected: boolean): string =>
  cn(
    "block truncate text-[11px]",
    selected ? "text-background/70" : "text-muted-foreground",
  );

/**
 * Classes of a sidebar row's menu trigger (`RowMenu`, `variant="ring"`):
 * shown while the row is hovered, while the trigger has keyboard focus, and
 * always on the selected row; it also stays while its menu is open, when
 * focus has moved into the portaled menu. Hovering lights the circle border
 * up with the glow of the `ring` variant. On the selected row, whose fill is
 * `foreground`, the icon, the circle and the glow take the inverse colour
 * (`background`), so the hover reads in both themes: light on the dark fill
 * of the light theme, dark on the light fill of the dark theme.
 *
 * @param selected - Whether the row is selected.
 * @returns The class list.
 */
export const sidebarRowMenuClassName = (selected: boolean): string =>
  cn(
    "shrink-0",
    selected
      ? cn(
          "text-background hover:border-background hover:text-background aria-expanded:text-background",
          "hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--background)_60%,transparent)]",
        )
      : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 aria-expanded:opacity-100",
  );
