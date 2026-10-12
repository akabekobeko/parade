import { FavoriteStarButton } from "@/components/app/FavoriteStarButton/FavoriteStarButton";
import { useT } from "@/features/i18n/useT";
import type { AlbumInfoTarget } from "@/features/library/albumInfoStore";
import { formatTime } from "@/libs/formatTime";
import { DialogTabPanel } from "../DialogTabPanel";
import { PropertyRow } from "../PropertyRow";
import type { useAlbumInfoDialog } from "./useAlbumInfoDialog";

type Props = {
  /** Album whose summary facts are shown. */
  readonly album: AlbumInfoTarget;
  /** The dialog's form (from `useAlbumInfoDialog`). */
  readonly form: ReturnType<typeof useAlbumInfoDialog>["form"];
  /** An apply is running: the Favorite toggle waits. */
  readonly disabled: boolean;
};

/**
 * "Details" tab: the summary-line facts of the Artist / Album views, read
 * only, and the Favorite row at the end
 * (`docs/specs/v1.4/features/album-favorite.md`). Its Star flips the form
 * value only; nothing is saved until Apply. While an apply runs the Star
 * ignores clicks and says so through `aria-disabled`; it has no disabled
 * look (`docs/specs/v1.4/features/favorite-star-button.md`).
 */
export const DetailsPanel = ({ album, form, disabled }: Props) => {
  const t = useT();
  return (
    <DialogTabPanel value="details" className="overflow-y-auto">
      <div className="grid gap-2">
        <PropertyRow label={t("albumInfo.field.album")} value={album.album} />
        <PropertyRow label={t("albumInfo.field.artist")} value={album.artist} />
        <PropertyRow
          label={t("albumInfo.field.year")}
          value={album.year !== null ? String(album.year) : ""}
        />
        <PropertyRow label={t("albumInfo.field.genre")} value={album.genre} />
        <PropertyRow
          label={t("albumInfo.field.songCount")}
          value={String(album.musicCount)}
        />
        <PropertyRow
          label={t("albumInfo.field.duration")}
          value={formatTime(album.totalDurationMs / 1000)}
        />
        <form.Field name="favorite">
          {(field) => (
            <PropertyRow
              label={t("albumInfo.field.favorite")}
              value={
                <FavoriteStarButton
                  favorite={field.state.value}
                  disabled={disabled}
                  onToggle={field.handleChange}
                />
              }
            />
          )}
        </form.Field>
      </div>
    </DialogTabPanel>
  );
};
