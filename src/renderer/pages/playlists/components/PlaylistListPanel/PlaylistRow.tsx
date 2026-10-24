import type { Playlist } from "@mp/ipc";
import { ListMusic, NotepadText, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useRef } from "react";
import { EllipsisText } from "@/components/app/EllipsisText/EllipsisText";
import { RowMenu } from "@/components/app/RowMenu/RowMenu";
import {
  sidebarRowClassName,
  sidebarRowCountClassName,
  sidebarRowMenuClassName,
} from "@/components/app/Sidebar/sidebarRowClassName";
import { SmartBadge } from "@/components/app/SmartBadge/SmartBadge";
import { Input } from "@/components/ui/input";
import { useT } from "@/features/i18n/useT";
import { playlistInfoStore } from "@/features/playlist/playlistInfoStore";
import { toMediaFileUrl } from "@/libs/toMediaFileUrl";
import { cn } from "@/libs/utils";

type Props = {
  /** The playlist shown: name, kind, picture, and song count. */
  readonly playlist: Playlist;
  /** Whether this playlist is the one selected by the route. */
  readonly selected: boolean;
  /** Whether the name is being renamed inline (the text turns into an input). */
  readonly editing: boolean;
  /** Click on the picture and text: navigate to the playlist. */
  readonly onOpen: () => void;
  /** Double-click on the text, or the menu's "Rename": start the inline rename. */
  readonly onStartRename: () => void;
  /** Blur / Enter of the rename input, with its value; the owner saves it. */
  readonly onRename: (name: string) => void;
  /** Escape in the rename input: drop the edit. */
  readonly onCancelRename: () => void;
  /** Menu "Delete": ask for confirmation. */
  readonly onDelete: () => void;
};

/**
 * One playlist row of the sidebar (`docs/specs/v1.6/features/sidebar-rows.md`),
 * laid out like `ArtistRow` with the shared row classes: a rounded-square
 * picture (or the kind's placeholder icon), name and song count in two
 * lines, and the menu button at the right edge, shown on hover and on the
 * selected row. A smart playlist with a picture gets the `SmartBadge` on the
 * picture's corner; without one, the `Sparkles` placeholder tells the kind.
 * While renaming, the two text lines turn into an input and the picture and
 * the menu stay put. Rows are laid out in flow (no virtualiser) at the
 * artist rows' height (`h-12` = `ARTIST_ROW_HEIGHT`), inset by the list's
 * padding; `relative` lets the hover glow rise above the next row's fill.
 */
export const PlaylistRow = ({
  playlist,
  selected,
  editing,
  onOpen,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete,
}: Props) => {
  const t = useT();
  const smart = playlist.kind === "smart";
  const Placeholder = smart ? Sparkles : ListMusic;
  const picture = (
    <span className="relative size-8 shrink-0">
      {playlist.picturePath !== null ? (
        <img
          src={toMediaFileUrl(playlist.picturePath)}
          alt=""
          className="size-8 rounded-md object-cover"
        />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-md bg-muted">
          <Placeholder aria-hidden className="size-4 text-muted-foreground" />
        </span>
      )}
      {smart && playlist.picturePath !== null && (
        <SmartBadge
          className={cn(
            "-right-1.5 -bottom-1 absolute size-4",
            // The ring cuts the badge out of the surface it rests on: the
            // sidebar, or the selected row's fill.
            selected ? "ring-foreground" : "ring-sidebar",
          )}
        />
      )}
    </span>
  );

  return (
    <div className={cn(sidebarRowClassName(selected), "relative h-12")}>
      {editing ? (
        <>
          {picture}
          <RenameInput
            name={playlist.name}
            onRename={onRename}
            onCancel={onCancelRename}
          />
        </>
      ) : (
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 self-stretch text-left"
          onClick={onOpen}
          onDoubleClick={onStartRename}
        >
          {picture}
          <span className="min-w-0 flex-1">
            <EllipsisText text={playlist.name} />
            <span className={sidebarRowCountClassName(selected)}>
              {t("artist.songs", { count: playlist.musicCount })}
            </span>
          </span>
        </button>
      )}
      <RowMenu
        className={sidebarRowMenuClassName(selected)}
        items={[
          {
            label: t("playlistInfo.menu"),
            icon: <NotepadText />,
            onSelect: () => playlistInfoStore.open(playlist),
          },
          {
            label: t("menu.rename"),
            icon: <Pencil />,
            onSelect: onStartRename,
          },
          {
            label: t("playlist.delete"),
            icon: <Trash2 />,
            onSelect: onDelete,
            destructive: true,
            separatorBefore: true,
          },
        ]}
      />
    </div>
  );
};

type RenameInputProps = {
  /** Current name, the input's initial value. */
  readonly name: string;
  /** Commit with the typed value (Enter or blur). */
  readonly onRename: (name: string) => void;
  /** Drop the edit (Escape). */
  readonly onCancel: () => void;
};

/**
 * The inline rename field. It settles exactly once: Enter commits, Escape
 * cancels, and the blur that follows either (the input unmounts while
 * focused) is ignored, so a rename is not sent twice and an escaped edit
 * is not saved by its blur. Mounted only while editing, so the flag starts
 * fresh for every edit.
 */
const RenameInput = ({ name, onRename, onCancel }: RenameInputProps) => {
  const settled = useRef(false);
  const settle = (action: () => void): void => {
    if (!settled.current) {
      settled.current = true;
      action();
    }
  };

  return (
    <Input
      autoFocus
      defaultValue={name}
      className="h-8 min-w-0 flex-1"
      onFocus={(event) => event.target.select()}
      onBlur={(event) => settle(() => onRename(event.target.value))}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          const value = event.currentTarget.value;
          settle(() => onRename(value));
        } else if (event.key === "Escape") {
          settle(onCancel);
        }
      }}
    />
  );
};
