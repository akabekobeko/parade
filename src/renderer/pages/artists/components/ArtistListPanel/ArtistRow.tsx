import type { Artist } from "@mp/ipc";
import { NotepadText, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "react-router";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import {
  sidebarRowClassName,
  sidebarRowCountClassName,
  sidebarRowMenuClassName,
} from "@/components/app/Sidebar/sidebarRowClassName";
import { useT } from "@/features/i18n/useT";
import { artistEditStore } from "@/features/library/artistEditStore";
import { libraryRemoveStore } from "@/features/library/libraryRemoveStore";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { cn } from "@/libs/utils";
import { artistPathOf } from "../../artistPath";

type Props = {
  /** The artist shown: name, picture, song count, and stored initial. */
  readonly artist: Artist;
  /** Whether this artist is the one selected by the route. */
  readonly selected: boolean;
  /** Virtualised position: top offset and height in px. */
  readonly top: number;
  /** Row height in px (`ARTIST_ROW_HEIGHT`, via the virtualiser). */
  readonly height: number;
};

/**
 * One virtualised artist row (picture, name, song count) with its menu
 * button at the right edge (`docs/specs/v1.6/features/sidebar-rows.md`).
 * The row shares its look with the playlist rows (`sidebarRowClassName`);
 * rows abut each other inside the scroll area, so the row is inset from the
 * panel edges (`inset-x-2`) to leave room for the hover glow. The menu shows
 * on hover and on the selected row. Editing keys off the artist name; the
 * empty-name bucket ("Unknown Artist") cannot hold a picture, so no edit
 * there — removal applies to every bucket.
 */
export const ArtistRow = ({ artist, selected, top, height }: Props) => {
  const t = useT();
  const navigate = useNavigate();
  return (
    <div
      className={cn(sidebarRowClassName(selected), "absolute inset-x-2 top-0")}
      style={{ height, transform: `translateY(${top}px)` }}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 self-stretch text-left"
        onClick={() => {
          navigate(artistPathOf(artist.name));
        }}
      >
        {artist.picturePath !== null ? (
          <img
            src={toMediaFileUrl(artist.picturePath)}
            alt=""
            className="size-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <UserRound aria-hidden className="size-4 text-muted-foreground" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <EllipsisText
            text={artist.name !== "" ? artist.name : t("artist.unknown")}
          />
          <span className={sidebarRowCountClassName(selected)}>
            {t("artist.songs", { count: artist.musicCount })}
          </span>
        </span>
      </button>
      <RowMenu
        variant="ring"
        className={sidebarRowMenuClassName(selected)}
        items={[
          ...(artist.name !== ""
            ? [
                {
                  label: t("artistEdit.menu"),
                  icon: <NotepadText />,
                  onSelect: () =>
                    artistEditStore.open({
                      name: artist.name,
                      picturePath: artist.picturePath,
                      musicCount: artist.musicCount,
                      initial: artist.initial,
                    }),
                },
              ]
            : []),
          {
            label: t("menu.removeFromLibrary"),
            icon: <Trash2 />,
            onSelect: () =>
              libraryRemoveStore.open({ kind: "artist", artist: artist.name }),
            destructive: true,
            separatorBefore: artist.name !== "",
          },
        ]}
      />
    </div>
  );
};
