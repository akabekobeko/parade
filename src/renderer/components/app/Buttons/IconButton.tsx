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
 * "circle" replaces that fill with a `foreground` circle border lit up by
 * the blurred `box-shadow` glow of `CircleIconButton` (whose border is
 * always on); the icon stays crisp inside. For the player bar, where the
 * buttons have room around them. The fill is cancelled for both the hover
 * and the open-menu state, in both themes.
 *
 * Either way a toggle (`aria-pressed`) colours its icon `pressed` while it
 * is on (the shuffle mode), also while hovered.
 */
const iconButtonVariants = cva(
  "text-foreground aria-pressed:text-pressed aria-pressed:hover:text-pressed",
  {
    variants: {
      variant: {
        tint: "",
        circle:
          "rounded-full duration-200 hover:border-foreground hover:bg-transparent hover:shadow-[0_0_5px_1px_color-mix(in_oklch,var(--foreground)_60%,transparent)] aria-expanded:bg-transparent",
      },
    },
    defaultVariants: {
      variant: "tint",
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
export const IconButton = ({ className, variant, ...props }: Props) => (
  <Button
    variant="ghost"
    size="icon-sm"
    className={cn(iconButtonVariants({ variant }), className)}
    {...props}
  />
);
