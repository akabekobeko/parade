import type { LibraryStats, ThemePreference } from "@mp/ipc";
import { importStore } from "@/features/import/importStore/importStore";
import { queryKeys } from "@/features/library/queryStore/queryKeys";
import { useLibraryQuery } from "@/features/library/useLibraryQuery";
import {
  useSettings,
  useSettingsCommands,
} from "@/features/settings/SettingsProvider";
import { settingsDialogStore } from "@/features/settings/settingsDialogStore";
import type { LocalePreference } from "../../../../shared/locales/types";

/**
 * Logic of `SettingsDialogContent`: the current settings, the library
 * stats, and the update handlers. Every change goes through
 * `mp:settings:set`; the merged response is the single source of truth
 * (SettingsProvider), so the dialog holds no local settings state.
 */
export const useSettingsDialogContent = () => {
  const settings = useSettings();
  const commands = useSettingsCommands();
  const statsState = useLibraryQuery<LibraryStats>(queryKeys.stats);

  const setTheme = (theme: string | null): void => {
    void commands.update({ theme: theme as ThemePreference });
  };

  const setLocale = (locale: string | null): void => {
    void commands.update({ locale: locale as LocalePreference });
  };

  // The import flow shows its own modal dialog (ImportConfirmDialog) after
  // the native file picker; close this one first so two modals never stack.
  const startImport = (): void => {
    settingsDialogStore.close();
    void importStore.openFromDialog();
  };

  return { settings, statsState, setTheme, setLocale, startImport };
};
