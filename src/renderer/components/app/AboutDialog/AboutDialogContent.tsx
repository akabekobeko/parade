import type { IpcError, Versions } from "@mp/ipc";
import { ExternalLink } from "@/components/app/ExternalLink/ExternalLink";
import { FormSection } from "@/components/app/FormSection/FormSection";
import { DialogBody } from "@/components/ui/dialog";
import { useT } from "@/features/i18n/useT";
import type { Locale } from "../../../../shared/locales/types";

/** The GitHub project; its README and package.json list the dependencies. */
const GITHUB_URL = "https://github.com/akabekobeko/parade";

/**
 * The official website (GitHub Pages). English is the root, Japanese lives
 * under `/ja/` (`docs/specs/web/architecture/i18n.md`).
 */
export const websiteUrlOf = (locale: Locale): string =>
  locale === "ja"
    ? "https://akabekobeko.github.io/parade/ja/"
    : "https://akabekobeko.github.io/parade/";

/** Services the fetch feature draws on, credited in the about dialog. */
const MUSIC_DATA_SOURCES = [
  { name: "MusicBrainz", url: "https://musicbrainz.org/" },
  { name: "Cover Art Archive", url: "https://coverartarchive.org/" },
] as const;

type Props = {
  /** `null` while the versions request is in flight. */
  readonly versions: Versions | null;
  readonly error: IpcError | null;
  /** Active UI locale; picks the website language. */
  readonly locale: Locale;
  /** Opens a URL in the default browser. */
  readonly onOpenExternal: (url: string) => void;
};

/**
 * Body of the about dialog: the runtime versions, the links to the official
 * website and the GitHub project (where the dependencies and their licenses
 * can be followed, always up to date), and the credit for the music data
 * services.
 */
export const AboutDialogContent = ({
  versions,
  error,
  locale,
  onOpenExternal,
}: Props) => {
  const t = useT();
  return (
    <DialogBody className="gap-6">
      {error !== null && (
        <p className="break-all text-destructive text-sm">
          {t("library.loadFailed", { message: error.message })}
        </p>
      )}
      {versions !== null && (
        <FormSection label={t("about.runtime")}>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Electron</dt>
            <dd className="tabular-nums">{versions.electron}</dd>
            <dt className="text-muted-foreground">Chromium</dt>
            <dd className="tabular-nums">{versions.chrome}</dd>
            <dt className="text-muted-foreground">Node.js</dt>
            <dd className="tabular-nums">{versions.node}</dd>
          </dl>
        </FormSection>
      )}
      <FormSection label={t("about.links")}>
        <ul className="flex flex-col gap-1 text-sm">
          <li>
            <ExternalLink href={websiteUrlOf(locale)} onOpen={onOpenExternal}>
              {t("about.links.website")}
            </ExternalLink>
          </li>
          <li>
            <ExternalLink href={GITHUB_URL} onOpen={onOpenExternal}>
              {t("about.links.github")}
            </ExternalLink>
          </li>
        </ul>
      </FormSection>
      <FormSection label={t("about.musicData")}>
        <p className="text-sm">{t("about.musicData.description")}</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {MUSIC_DATA_SOURCES.map((source) => (
            <li key={source.url}>
              <ExternalLink href={source.url} onOpen={onOpenExternal}>
                {source.name}
              </ExternalLink>
            </li>
          ))}
        </ul>
      </FormSection>
    </DialogBody>
  );
};
