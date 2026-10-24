import { Asterisk } from "lucide-react";
import { cn } from "@/libs/utils";

type Props = {
  /**
   * Classes of the badge circle: its position inside the picture frame, its
   * size, and the `ring-*` colour matching the surface it sits on. The
   * sidebar row's defaults are `absolute -right-1.5 -bottom-1 size-4`.
   */
  readonly className?: string;
  /** Classes of the asterisk, for a bigger badge (defaults to `size-3`). */
  readonly iconClassName?: string;
};

/**
 * Smart-playlist mark overlaid on a playlist picture
 * (`docs/specs/v1.6/features/sidebar-rows.md`): a small circle filled with
 * the theme-independent `smart` colour, a white asterisk, and a ring in the
 * surface colour plus a soft shadow so it reads as a disc resting on the
 * picture. Decorative (`aria-hidden`); the content header's text badge is
 * what reads the kind.
 */
export const SmartBadge = ({ className, iconClassName }: Props) => (
  <span
    aria-hidden
    className={cn(
      "flex items-center justify-center rounded-full bg-smart shadow-sm ring-2",
      className,
    )}
  >
    <Asterisk
      strokeWidth={2.5}
      className={cn("size-3 text-white", iconClassName)}
    />
  </span>
);
