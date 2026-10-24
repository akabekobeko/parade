import { formatTime } from "@/libs/formatTime";
import { cn } from "@/libs/utils";
import { EllipsisText } from "../../EllipsisText/EllipsisText";
import { AudioLinesIcon } from "../../Icons/AudioLinesIcon";
import { VolumeFillIcon } from "../../Icons/VolumeFillIcon";
import { LIST_HEIGHT, useQueueList } from "./useQueueList";

/**
 * The virtualised queue rows. Mounted per popover open, so the initial
 * scroll offset (centering the current track) is computed at mount — no
 * imperative scroll effect.
 *
 * The rows look like the track rows (`MusicRow`): rounded rectangles inset
 * from the popover edges, the hovered row tinted with the half-transparent
 * accent, and the current row filled with `foreground` with its texts in
 * the inverse colour (`background`, toned down for the artist and the
 * duration). The leading cell of the current row is the playing indicator
 * of the track rows, the pulsing `AudioLinesIcon` while playing and the
 * speaker while paused; it is an indicator only, the whole row is the
 * button that jumps to the track.
 */
export const QueueList = () => {
  const { queue, playbackState, currentIndex, scrollRef, virtualizer, jumpTo } =
    useQueueList();

  return (
    <div
      ref={scrollRef}
      className="overflow-y-auto"
      style={{ maxHeight: LIST_HEIGHT }}
    >
      <div
        className="relative w-full"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const music = queue[item.index];
          if (music === undefined) {
            return null;
          }

          const isCurrent = item.index === currentIndex;
          return (
            <button
              key={item.index}
              type="button"
              className={cn(
                "absolute inset-x-2 top-0 flex items-center gap-2 rounded-md px-2 text-left",
                isCurrent
                  ? "bg-foreground text-background"
                  : "hover:bg-accent/50",
              )}
              style={{
                height: item.size,
                transform: `translateY(${item.start}px)`,
              }}
              onClick={() => jumpTo(music)}
            >
              <span className="flex w-4 shrink-0 items-center justify-center">
                {isCurrent &&
                  (playbackState === "playing" ? (
                    <AudioLinesIcon className="size-4" />
                  ) : (
                    <VolumeFillIcon aria-hidden className="size-4" />
                  ))}
              </span>
              <span className="min-w-0 flex-1">
                <EllipsisText
                  className={cn("text-sm", isCurrent && "font-medium")}
                  text={music.title}
                />
                <EllipsisText
                  className={cn(
                    "text-[11px]",
                    isCurrent ? "text-background/70" : "text-muted-foreground",
                  )}
                  text={music.artist}
                />
              </span>
              <span
                className={cn(
                  "shrink-0 font-mono text-xs tabular-nums",
                  isCurrent ? "text-background/70" : "text-muted-foreground",
                )}
              >
                {formatTime(music.durationMs / 1000)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
