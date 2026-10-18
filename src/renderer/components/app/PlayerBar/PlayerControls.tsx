import { Loader2 } from "lucide-react";
import { useT } from "@/features/i18n/useT";
import { CircleIconButton } from "../Buttons/CircleIconButton";
import { IconButton } from "../Buttons/IconButton";
import { PauseFillIcon } from "../Icons/PauseFillIcon";
import { PlayFillIcon } from "../Icons/PlayFillIcon";
import { SkipBackFillIcon } from "../Icons/SkipBackFillIcon";
import { SkipForwardFillIcon } from "../Icons/SkipForwardFillIcon";
import { HStack } from "../stacks";

type Props = {
  /** Whether a previous track exists in the queue. */
  readonly hasPrevious: boolean;
  /** Whether a next track exists in the queue. */
  readonly hasNext: boolean;
  /** Whether a track is loaded — gates play/pause. */
  readonly hasTrack: boolean;
  /** Engine is playing: the centre button shows pause instead of play. */
  readonly isPlaying: boolean;
  /** Engine is loading — shows a spinner in place of play/pause. */
  readonly isLoading: boolean;
  /** Previous button click; `PlayerBand` maps it to `playPrevious`. */
  readonly onPrevious: () => void;
  /** Centre button click; only reachable while `hasTrack`. */
  readonly onTogglePlayPause: () => void;
  /** Next button click; `PlayerBand` maps it to `playNext`. */
  readonly onNext: () => void;
};

/**
 * Transport controls: previous, play/pause, next. Stop has no button
 * (Apple Music-style): it lives in the Controls menu and the bar's
 * right-click menu. Previous / next are a step larger than the stock
 * `IconButton` (32px instead of 28px, icon unchanged) so the hover ring
 * keeps some air around the glyph instead of hugging it.
 */
export const PlayerControls = ({
  hasPrevious,
  hasNext,
  hasTrack,
  isPlaying,
  isLoading,
  onPrevious,
  onTogglePlayPause,
  onNext,
}: Props) => {
  const t = useT();
  return (
    <HStack className="gap-1">
      <IconButton
        variant="ring"
        className="size-8"
        aria-label={t("player.previous")}
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        <SkipBackFillIcon />
      </IconButton>
      <CircleIconButton
        className="size-10"
        aria-label={isPlaying ? t("player.pause") : t("player.play")}
        disabled={!hasTrack}
        onClick={onTogglePlayPause}
      >
        {isLoading ? (
          <Loader2 className="animate-spin" />
        ) : isPlaying ? (
          <PauseFillIcon />
        ) : (
          <PlayFillIcon />
        )}
      </CircleIconButton>
      <IconButton
        variant="ring"
        className="size-8"
        aria-label={t("player.next")}
        disabled={!hasNext}
        onClick={onNext}
      >
        <SkipForwardFillIcon />
      </IconButton>
    </HStack>
  );
};
