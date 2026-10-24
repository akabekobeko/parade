import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/libs/utils";

/**
 * Hover looks of the borderless icon button. Both replace the old lamp glow
 * on the glyph itself: a glow following the icon's shape blurred the
 * artwork of the icon, and in the light theme the dark halo read as a
 * shadow, so it looked like noise rather than feedback.
 *
 * "tint" (default) is the `ghost` Button's own hover: a rounded rectangle
 * behind the icon filled with a translucent `foreground`, a touch darker
 * than the page in the light theme and a touch lighter in the dark theme.
 * For the narrow spots where a circle would not fit: the toolbar icon
 * cluster, the sidebar panel headers, the content toolbar's menus, and
 * icon buttons in general. The open-menu state (`aria-expanded`) keeps the
 * same fill.
 *
 * "ring" replaces that fill with a `foreground` circle border lit up by
 * the blurred `box-shadow` glow of `CircleIconButton` (whose border is
 * always on); the icon stays crisp inside. For the player bar and the
 * track rows' menu trigger, where the buttons have room around them. The
 * fill is cancelled for both the hover and the open-menu state, in both
 * themes.
 *
 * Either way a toggle (`aria-pressed`) colours its icon `pressed` while it
 * is on (the shuffle mode), also while hovered.
 *
 * `inverse` is for a button resting on a `foreground` fill (the selected
 * sidebar row, the playing track row): the icon, and for "ring" the circle
 * border and its glow, take the inverse colour (`background`), so the
 * button reads in both themes. The `foreground` tint of "tint" would vanish
 * on that fill, so it becomes a faint `background` tint instead. The
 * "group-hover" value is for a row (the `group`) that is filled only while
 * hovered (the unselected sidebar rows): the same look, applied under
 * `group-hover`. The icon colour is repeated for the button's own hover and
 * open-menu state, because the `ghost` Button's `hover:text-foreground` /
 * `aria-expanded:text-foreground` would otherwise win over the plain
 * `group-hover` rule. Either way the colours switch without a transition
 * (only the ring's border and glow keep easing), so the icon never fades
 * on a row whose fill has just snapped.
 */
const iconButtonVariants = cva(
  "text-foreground aria-pressed:text-pressed aria-pressed:hover:text-pressed",
  {
    variants: {
      variant: {
        tint: "",
        ring: "rounded-full duration-200 hover:border-foreground hover:bg-transparent hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)] aria-expanded:bg-transparent",
      },
      inverse: {
        true: "transition-[border-color,box-shadow] text-background hover:text-background aria-expanded:text-background",
        "group-hover":
          "transition-[border-color,box-shadow] group-hover:text-background group-hover:hover:text-background group-hover:aria-expanded:text-background",
        false: "",
      },
    },
    compoundVariants: [
      {
        variant: "tint",
        inverse: true,
        class: "hover:bg-background/15 aria-expanded:bg-background/15",
      },
      {
        variant: "tint",
        inverse: "group-hover",
        class:
          "group-hover:hover:bg-background/15 group-hover:aria-expanded:bg-background/15",
      },
      {
        variant: "ring",
        inverse: true,
        class:
          "hover:border-background hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--background)_60%,transparent)]",
      },
      {
        variant: "ring",
        inverse: "group-hover",
        class:
          "group-hover:hover:border-background group-hover:hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--background)_60%,transparent)]",
      },
    ],
    defaultVariants: {
      variant: "tint",
      inverse: false,
    },
  },
);

type Props = Omit<ComponentProps<typeof Button>, "variant" | "size"> &
  VariantProps<typeof iconButtonVariants>;

/**
 * Borderless small icon button (see {@link iconButtonVariants} for the two
 * hover looks). Disabled buttons get `pointer-events-none` from `Button`,
 * so they never react to hover. Pass `aria-label` for the icon.
 */
export const IconButton = ({
  className,
  variant,
  inverse,
  ...props
}: Props) => (
  <Button
    variant="ghost"
    size="icon-sm"
    className={cn(iconButtonVariants({ variant, inverse }), className)}
    {...props}
  />
);
