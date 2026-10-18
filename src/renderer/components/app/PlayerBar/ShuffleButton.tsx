import { Shuffle as ShuffleIcon } from "lucide-react";
import { useT } from "@/features/i18n/useT";
import { IconButton } from "../Buttons/IconButton";

type Props = {
  /** Shuffle mode is on: the icon takes the `pressed` colour. */
  readonly active: boolean;
  /** Button click; `PlayerBand` maps it to `commands.toggleShuffle`. */
  readonly onToggle: () => void;
};

/**
 * Shuffle-mode toggle right of the seek bar. `IconButton` renders the on
 * state (`pressed` coloured icon) from `aria-pressed`, so the mode reads at
 * a glance without any styling here; hover is the player's circle border.
 */
export const ShuffleButton = ({ active, onToggle }: Props) => {
  const t = useT();
  return (
    <IconButton
      variant="circle"
      aria-label={t("player.shuffle")}
      title={t("player.shuffle")}
      aria-pressed={active}
      onClick={onToggle}
    >
      <ShuffleIcon />
    </IconButton>
  );
};
