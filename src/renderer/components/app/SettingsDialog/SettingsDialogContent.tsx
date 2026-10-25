import { FolderInput } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogBody } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/features/i18n/useT";
import { formatTime } from "@/libs/formatTime";
import { FormSection } from "../FormSection/FormSection";
import { SettingsRow } from "./SettingsRow";
import { StatRow } from "./StatRow";
import { useSettingsDialogContent } from "./useSettingsDialogContent";

/**
 * Body of the settings dialog
 * (`docs/specs/v1.0/architecture/process-model.md`): theme, language, and
 * the library section (stats + import entrance). Scrolls inside the popup
 * when the window is too short for it.
 */
export const SettingsDialogContent = () => {
  const t = useT();
  const { settings, statsState, setTheme, setLocale, startImport } =
    useSettingsDialogContent();

  return (
    <DialogBody className="gap-6 overflow-y-auto">
      <FormSection label={t("settings.appearance")}>
        <SettingsRow label={t("settings.theme")}>
          <Select
            value={settings.theme ?? "system"}
            items={{
              system: t("settings.theme.system"),
              light: t("settings.theme.light"),
              dark: t("settings.theme.dark"),
            }}
            onValueChange={setTheme}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(["system", "light", "dark"] as const).map((theme) => (
                <SelectItem key={theme} value={theme}>
                  {t(`settings.theme.${theme}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsRow>
        <SettingsRow label={t("settings.language")}>
          <Select
            value={settings.locale ?? "system"}
            // Language names are intentionally not translated: each locale
            // is shown in its own language so it stays recognisable.
            items={{
              system: t("settings.language.system"),
              en: "English",
              ja: "日本語",
            }}
            onValueChange={setLocale}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">
                {t("settings.language.system")}
              </SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="ja">日本語</SelectItem>
            </SelectContent>
          </Select>
        </SettingsRow>
      </FormSection>

      <FormSection label={t("settings.library")}>
        {statsState.status === "error" && (
          <p className="break-all text-destructive text-sm">
            {t("library.loadFailed", { message: statsState.error.message })}
          </p>
        )}
        {statsState.status === "success" && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
            <StatRow
              label={t("settings.stats.musics")}
              value={String(statsState.value.musicCount)}
            />
            <StatRow
              label={t("settings.stats.artists")}
              value={String(statsState.value.artistCount)}
            />
            <StatRow
              label={t("settings.stats.albums")}
              value={String(statsState.value.albumCount)}
            />
            <StatRow
              label={t("settings.stats.duration")}
              value={formatTime(statsState.value.totalDurationMs / 1000)}
            />
          </dl>
        )}
        <div>
          <Button variant="outline" size="sm" onClick={startImport}>
            <FolderInput /> {t("sidebar.import")}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          {t("settings.library.removeHint")}
        </p>
      </FormSection>
    </DialogBody>
  );
};
