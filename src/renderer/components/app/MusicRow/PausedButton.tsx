import { useT } from "@/features/i18n/useT";
import { cn } from "@/libs/utils";
import { PlayFillIcon } from "../Icons/PlayFillIcon";
import { VolumeFillIcon } from "../Icons/VolumeFillIcon";
import { HoverIconButton } from "./HoverIconButton";

type Props = {
  /**
   * Resume the current track from the paused position. Without it the cell
   * is a plain indicator.
   */
  readonly onResume?: () => void;
};

/**
 * Leading cell of the paused row: the speaker icon, swapped for a resume
 * play button on row hover. The row is filled with `foreground`, so both
 * take the inverse colour (`background`).
 */
export const PausedButton = ({ onResume }: Props) => {
  const t = useT();
  return (
    <>
      <VolumeFillIcon
        aria-hidden
        className={cn(
          "size-4 text-background",
          onResume !== undefined && "group-hover:hidden",
        )}
      />
      {onResume !== undefined && (
        <HoverIconButton
          aria-label={t("player.play")}
          className="text-background"
          onClick={onResume}
        >
          <PlayFillIcon className="size-4" />
        </HoverIconButton>
      )}
    </>
  );
};
