import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AspectFitPicture } from "./AspectFitPicture";

type Props = {
  /** Picture to show (current one, or the preview of a picked file). */
  readonly imageUrl: string | null;
  /** Icon of the placeholder shown without a picture. */
  readonly placeholderIcon: LucideIcon;
  /** Accessible name of the file input. */
  readonly label: string;
  /**
   * Called with the image file the user picked, or `null` when the picker
   * was cancelled after a pick (the browser then empties the input, so the
   * earlier pick must not be saved any more).
   */
  readonly onSelectFile: (file: File | null) => void;
};

/**
 * Editable picture of an info dialog: the current (or previewed) picture
 * aspect-fit above the file picker. Shared by the artist and the playlist
 * dialogs; the parent must be a flex column for the picture to take the
 * remaining height.
 */
export const PictureField = ({
  imageUrl,
  placeholderIcon,
  label,
  onSelectFile,
}: Props) => (
  <>
    <AspectFitPicture src={imageUrl} placeholderIcon={placeholderIcon} />
    <Input
      type="file"
      accept="image/*"
      aria-label={label}
      className="shrink-0"
      onChange={(event) => onSelectFile(event.target.files?.[0] ?? null)}
    />
  </>
);
