import { Star } from "lucide-react";
import { StarFillIcon } from "@/components/app/Icons/StarFillIcon";
import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";

/**
 * Classes of a Star resting on a `foreground` fill (the playing track row):
 * on and off take the inverse colour (`background`), the off outline toned
 * down the same way as on the page. Passed through `className`, where the
 * text colours override the defaults.
 */
export const INVERSE_STAR_CLASS_NAME =
  "text-background/40 aria-pressed:text-background hover:text-background";

type Props = {
  /** Current flag value. */
  readonly favorite: boolean;
  /** Called with the flipped value; the caller runs the IPC and the cache update. */
  readonly onToggle: (next: boolean) => void;
  /**
   * Clicks are ignored and `aria-disabled` is set (the look stays, there is
   * no disabled style): the album info dialog's Star while an apply runs.
   */
  readonly disabled?: boolean;
  /** Extra classes for the button (placement in a row or a card). */
  readonly className?: string;
};

/**
 * Star toggle shared by the track rows, the Playlist cells, and the album
 * cards (`docs/specs/v1.4/features/favorite-star-button.md`).
 *
 * Off is an outline in a faint colour that reads as "not a favorite yet",
 * on is the solid star in the normal colour; hovering either lights the icon
 * up with the same blurred `drop-shadow` glow as `HoverIconButton` (and
 * brings the faint outline to the normal colour). Unlike `HoverIconButton`
 * the star is always visible, and it has no tooltip: hovering it on every
 * row would keep popping one up, so the state is told by `aria-pressed` and
 * the `aria-label` alone.
 *
 * Knows nothing about IPC: it only reports the flipped value. There is no
 * disabled look and no double-click guard; the update is one quick UPDATE
 * and the last click's value is the one that stays. `disabled` exists for
 * the one place a click must wait (a form being applied): it keeps the
 * button focusable and announces the state through `aria-disabled`.
 */
export const FavoriteStarButton = ({
  favorite,
  onToggle,
  disabled = false,
  className,
}: Props) => {
  const t = useT();
  return (
    <button
      type="button"
      aria-pressed={favorite}
      aria-disabled={disabled || undefined}
      aria-label={favorite ? t("favorite.remove") : t("favorite.add")}
      className={cn(
        "inline-flex size-4 items-center justify-center transition-[color,filter] duration-200",
        "hover:drop-shadow-[0_0_3px_color-mix(in_oklch,currentColor_60%,transparent)]",
        favorite
          ? "text-foreground"
          : "text-muted-foreground/40 hover:text-foreground",
        className,
      )}
      onClick={() => {
        if (!disabled) {
          onToggle(!favorite);
        }
      }}
    >
      {favorite ? (
        <StarFillIcon aria-hidden className="size-4" />
      ) : (
        <Star aria-hidden className="size-4" />
      )}
    </button>
  );
};
