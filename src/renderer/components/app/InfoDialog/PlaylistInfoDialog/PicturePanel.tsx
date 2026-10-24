import { Sparkles } from "lucide-react";
import { useT } from "@/features/i18n/useT";
import { DialogTabPanel } from "../DialogTabPanel";
import { PictureField } from "../PictureField";

type Props = {
  /** Picture to show (current one, or the preview of a picked file). */
  readonly imageUrl: string | null;
  /** Called with the picked image file, or `null` when the pick was cleared. */
  readonly onSelectFile: (file: File | null) => void;
};

/**
 * "Picture" tab of a smart playlist. Kept mounted while another tab is
 * shown so the native file input keeps showing the picked file name until
 * the dialog closes.
 */
export const PicturePanel = ({ imageUrl, onSelectFile }: Props) => {
  const t = useT();
  return (
    <DialogTabPanel value="picture" keepMounted className="flex flex-col gap-4">
      <PictureField
        imageUrl={imageUrl}
        placeholderIcon={Sparkles}
        label={t("playlistInfo.imageFile")}
        onSelectFile={onSelectFile}
      />
    </DialogTabPanel>
  );
};
