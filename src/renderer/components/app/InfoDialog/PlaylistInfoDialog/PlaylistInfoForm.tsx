import type { Playlist } from "@mp/ipc";
import { ListMusic } from "lucide-react";
import { FormSection } from "@/components/app/FormSection/FormSection";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/features/i18n/useT";
import { DialogTabList } from "../DialogTabList";
import { PictureField } from "../PictureField";
import { DetailsPanel } from "./DetailsPanel";
import { NameField } from "./NameField";
import { PicturePanel } from "./PicturePanel";
import { usePlaylistInfoDialog } from "./usePlaylistInfoDialog";

type Props = {
  /** The playlist as the dialog opened it. */
  readonly target: Playlist;
};

/**
 * Body and footer of the playlist info dialog, mounted per opened playlist
 * (the state starts from `target`). A static playlist edits its name and
 * picture without tabs; a smart playlist splits "Details" (name, rules) and
 * "Picture" into tabs like the artist dialog. Every input lives in
 * `usePlaylistInfoDialog`, so switching tabs keeps it and Apply commits the
 * picks of every tab at once. The body has a fixed height so the popup
 * keeps its size; an apply failure shows under the form whichever tab is
 * open.
 */
export const PlaylistInfoForm = ({ target }: Props) => {
  const t = useT();
  const {
    name,
    setName,
    rules,
    imageUrl,
    canApply,
    error,
    selectFile,
    apply,
    close,
  } = usePlaylistInfoDialog(target);

  return (
    <>
      <DialogBody className="h-[60vh] px-0 pb-0">
        {target.kind === "smart" ? (
          <Tabs defaultValue="details" className="min-h-0 flex-1">
            <DialogTabList>
              <TabsTrigger value="details">
                {t("playlistInfo.tab.details")}
              </TabsTrigger>
              <TabsTrigger value="picture">
                {t("playlistInfo.tab.picture")}
              </TabsTrigger>
            </DialogTabList>
            <DetailsPanel name={name} onChangeName={setName} rules={rules} />
            <PicturePanel imageUrl={imageUrl} onSelectFile={selectFile} />
          </Tabs>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-6 px-4 pb-4">
            <NameField value={name} onChange={setName} />
            <FormSection
              label={t("playlistInfo.tab.picture")}
              className="min-h-0 flex-1"
            >
              <PictureField
                imageUrl={imageUrl}
                placeholderIcon={ListMusic}
                label={t("playlistInfo.imageFile")}
                onSelectFile={selectFile}
              />
            </FormSection>
          </div>
        )}
        {error !== null && (
          <p className="break-all px-4 pb-4 text-destructive text-sm">
            {t("playlistInfo.failed", { message: error.message })}
          </p>
        )}
      </DialogBody>
      <DialogFooter>
        <Button variant="outline" onClick={close}>
          {t("common.cancel")}
        </Button>
        <Button disabled={!canApply} onClick={() => void apply()}>
          {t("playlistInfo.apply")}
        </Button>
      </DialogFooter>
    </>
  );
};
