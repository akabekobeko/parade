import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/features/i18n/useT";
import type { AlbumInfoTarget } from "@/features/library/albumInfoStore";
import { DialogTabList } from "../DialogTabList";
import { InfoDialogHeader } from "../InfoDialogHeader";
import { PicturePanel } from "../PicturePanel";
import { DetailsPanel } from "./DetailsPanel";
import { useAlbumInfoDialog } from "./useAlbumInfoDialog";

/** The dialog's tabs; the session keeps the open one across albums. */
const ALBUM_INFO_TABS = ["details", "picture"] as const;

export type AlbumInfoTab = (typeof ALBUM_INFO_TABS)[number];

const isAlbumInfoTab = (value: unknown): value is AlbumInfoTab =>
  ALBUM_INFO_TABS.some((tab) => tab === value);

type Props = {
  /** Album on display. */
  readonly album: AlbumInfoTarget;
  /** Album the header's "previous" arrow moves to, `null` when none. */
  readonly previous: AlbumInfoTarget | null;
  /** Album the header's "next" arrow moves to, `null` when none. */
  readonly next: AlbumInfoTarget | null;
  /** The open tab, kept by the session. */
  readonly tab: AlbumInfoTab;
  /** Tab switch. */
  readonly onTabChange: (tab: AlbumInfoTab) => void;
  /** Reports whether an apply is running (Esc / backdrop must not close then). */
  readonly onApplyingChange: (applying: boolean) => void;
};

/**
 * One album of the album info dialog: the header, the two tabs and the
 * Cancel / Apply footer inside the session's popup
 * (`AlbumInfoDialogSession`). Cancel goes through the hook's `close`, which
 * refuses while an apply runs; the session guards Esc / backdrop the same
 * way from the reported state. The session remounts this component per
 * album, so the form starts from the right value every time
 * (`docs/specs/v1.4/features/album-favorite.md`).
 *
 * The header arrows are disabled at the ends of the list the album was
 * opened from (or when it was opened without one) and while an apply runs.
 */
export const AlbumInfoDialogContent = ({
  album,
  previous,
  next,
  tab,
  onTabChange,
  onApplyingChange,
}: Props) => {
  const t = useT();
  const {
    form,
    applying,
    canApply,
    error,
    apply,
    close,
    showPrevious,
    showNext,
  } = useAlbumInfoDialog(album);

  // Reporting to the session, which owns the popup around this content.
  useEffect(() => {
    onApplyingChange(applying);
  }, [applying, onApplyingChange]);

  return (
    <>
      <InfoDialogHeader
        title={t("albumInfo.title")}
        navigation={{
          previousLabel: t("albumInfo.previous"),
          nextLabel: t("albumInfo.next"),
          hasPrevious: previous !== null && !applying,
          hasNext: next !== null && !applying,
          onPrevious: showPrevious,
          onNext: showNext,
        }}
      />
      <DialogBody className="h-[60vh] px-0 pb-0">
        <Tabs
          value={tab}
          onValueChange={(value) => {
            if (isAlbumInfoTab(value)) {
              onTabChange(value);
            }
          }}
          className="min-h-0 flex-1"
        >
          <DialogTabList>
            <TabsTrigger value="details">
              {t("albumInfo.tab.details")}
            </TabsTrigger>
            <TabsTrigger value="picture">
              {t("albumInfo.tab.picture")}
            </TabsTrigger>
          </DialogTabList>
          <DetailsPanel album={album} form={form} disabled={applying} />
          <PicturePanel value="picture" picturePath={album.picturePath} />
        </Tabs>
        {error !== null && (
          <p className="shrink-0 break-all px-4 pb-4 text-destructive text-sm">
            {t("albumInfo.failed", { message: error.message })}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" disabled={applying} onClick={close}>
          {t("common.cancel")}
        </Button>
        <Button disabled={!canApply} onClick={() => void apply()}>
          {applying && <Loader2 className="animate-spin" />}
          {t("albumInfo.apply")}
        </Button>
      </DialogFooter>
    </>
  );
};
