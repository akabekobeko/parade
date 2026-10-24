import type { Music } from "@mp/ipc";
import { ListMusic, NotepadText, Shuffle as ShuffleIcon } from "lucide-react";
import { AddToPlaylistSubmenu } from "@/components/app/AddToPlaylistSubmenu/AddToPlaylistSubmenu";
import { CircleIconButton } from "@/components/app/Buttons/CircleIconButton";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { PlayFillIcon } from "@/components/app/Icons/PlayFillIcon";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import { HStack, Spacer, VStack } from "@/components/app/stacks";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/features/i18n/useT";
import { formatTime } from "@/libs/formatTime";

type Props = {
  /** Playlist name; `""` until the playlist entry has loaded. */
  readonly name: string;
  /** Whether this is a smart playlist (badge). */
  readonly smart: boolean;
  /** Visible tracks in play order; also the "Add to playlist" target. */
  readonly musics: readonly Music[];
  /** Sum of the visible tracks' durations in ms (shown via `formatTime`). */
  readonly totalDurationMs: number;
  /** Icon overlay / menu "Play playlist"; plays `musics` from the top. */
  readonly onPlayAll: () => void;
  /** Shuffle circle / menu "Shuffle play"; plays `musics` shuffled. */
  readonly onPlayShuffled: () => void;
  /**
   * Menu "Playlist Info": opens the playlist info dialog; `null` disables
   * the item until the playlist entry has loaded.
   */
  readonly onOpenInfo: (() => void) | null;
};

/**
 * Playlist area laid out like `ArtistHeader`: icon tile with a hover play
 * overlay, name and counts on the left; shuffle / menu circles on the
 * right. The right padding matches the table's horizontal padding (24px)
 * plus the menu cell's `px-2`, so the menu lines up with the track menus.
 * The menu ends with "Playlist Info" for both kinds
 * (`docs/specs/v1.6/features/playlist-header.md`).
 */
export const PlaylistHeader = ({
  name,
  smart,
  musics,
  totalDurationMs,
  onPlayAll,
  onPlayShuffled,
  onOpenInfo,
}: Props) => {
  const t = useT();
  const musicCount = musics.length;

  return (
    <HStack className="gap-4 border-b py-4 pr-8 pl-6">
      <div className="group relative shrink-0">
        <VStack className="size-16 rounded-md bg-muted">
          <ListMusic aria-hidden className="size-7 text-muted-foreground" />
        </VStack>
        <button
          type="button"
          aria-label={t("menu.playPlaylist")}
          title={t("menu.playPlaylist")}
          disabled={musicCount === 0}
          className="absolute inset-0 m-auto flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-md transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={onPlayAll}
        >
          <PlayFillIcon className="size-4" />
        </button>
      </div>
      <div className="min-w-0">
        <h1 className="flex min-w-0 items-center gap-2 font-semibold text-lg">
          <EllipsisText className="min-w-0" text={name} />
          {smart && (
            <Badge variant="secondary">{t("playlist.smartBadge")}</Badge>
          )}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("artist.songs", { count: musicCount })}
          {" · "}
          {formatTime(totalDurationMs / 1000)}
        </p>
      </div>
      <Spacer />
      <HStack className="shrink-0">
        <CircleIconButton
          aria-label={t("menu.shufflePlay")}
          title={t("menu.shufflePlay")}
          disabled={musicCount === 0}
          onClick={onPlayShuffled}
        >
          <ShuffleIcon />
        </CircleIconButton>
        <RowMenu
          variant="circle"
          items={[
            {
              label: t("menu.playPlaylist"),
              icon: <PlayFillIcon />,
              onSelect: onPlayAll,
            },
            {
              label: t("menu.shufflePlay"),
              icon: <ShuffleIcon />,
              onSelect: onPlayShuffled,
            },
            <AddToPlaylistSubmenu key="playlist" musics={musics} />,
            {
              label: t("playlistInfo.menu"),
              icon: <NotepadText />,
              onSelect: onOpenInfo ?? undefined,
              disabled: onOpenInfo === null,
              separatorBefore: true,
            },
          ]}
        />
      </HStack>
    </HStack>
  );
};
