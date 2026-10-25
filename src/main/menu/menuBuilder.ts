import type { MenuItemConstructorOptions } from "electron";
import { tFor } from "../../shared/locales/t/tFor";
import type { Locale } from "../../shared/locales/types";
import type { MenuAction, MenuStateSnapshot } from "../ipc/types";

/**
 * Pure application-menu template builder
 * (`docs/specs/v1.0/architecture/process-model.md`). Free of value-level
 * `electron` imports so the structure is unit-testable; `applicationMenu.ts`
 * feeds the template into `Menu.buildFromTemplate`.
 *
 * Menu actions never run app logic here — every custom item forwards a
 * {@link MenuAction} through `onAction`, which Main pushes to the Renderer
 * via `mp:menu:action`.
 *
 * Standard items (Undo, Copy, Zoom In, Minimize, ...) keep their `role` for
 * the behaviour but always carry an explicit `label`: Electron's role labels
 * are hard-coded English, so the composite `editMenu` / `viewMenu` /
 * `windowMenu` roles would stay English while the top-level labels follow
 * the app locale (`docs/specs/v1.0/cross-platform/system-menu.md`). The items
 * macOS itself injects (Start Dictation, Emoji & Symbols, the window list)
 * are outside this template and follow the OS language.
 */

/** Inputs deciding the template. */
export type MenuBuildOptions = {
  /**
   * `process.platform` value. `"darwin"` gets the app menu (About, Settings,
   * Quit) and File > Close; every other platform puts Settings / Quit under
   * File and About under Help.
   */
  readonly platform: NodeJS.Platform;
  /** Resolved UI locale; every label is translated through `tFor(locale)`. */
  readonly locale: Locale;
  /** App display name (the macOS app menu title / about label). */
  readonly appName: string;
  /**
   * Latest `mp:menu:setState` snapshot: gates the playback items (Controls
   * > Stop enables only while a track is loaded) and checks the mode items
   * (Controls > Shuffle, Controls > Repeat > Off / All / One).
   */
  readonly state: MenuStateSnapshot;
  /**
   * Whether View gets the developer items (Reload, Force Reload, Toggle
   * Developer Tools). Development builds only (`!app.isPackaged`): a reload
   * would stop playback and drop the queue, so end users never see them.
   */
  readonly devTools: boolean;
  /** Receives the action of a clicked custom item. */
  readonly onAction: (action: MenuAction) => void;
};

/**
 * A standard item: Electron's `role` for the behaviour, our label for the
 * text (role labels are English only).
 *
 * @param role - The Electron role.
 * @param label - Translated label.
 * @returns The item.
 */
const roleItem = (
  role: NonNullable<MenuItemConstructorOptions["role"]>,
  label: string,
): MenuItemConstructorOptions => ({ role, label });

/**
 * Build the application menu template.
 *
 * @param options - Platform, locale, state, and the action sink.
 * @returns Template for `Menu.buildFromTemplate`.
 */
export const buildMenuTemplate = (
  options: MenuBuildOptions,
): MenuItemConstructorOptions[] => {
  const { platform, locale, appName, state, devTools, onAction } = options;
  const t = tFor(locale);
  const isMac = platform === "darwin";
  // A factory, not a shared object: Electron annotates template items in
  // place, so every position gets its own separator.
  const separator = (): MenuItemConstructorOptions => ({ type: "separator" });

  const aboutItem: MenuItemConstructorOptions = {
    label: t("menu.about", { appName }),
    click: () => onAction("showAbout"),
  };
  const settingsItem: MenuItemConstructorOptions = {
    label: t("menu.settings"),
    accelerator: "CmdOrCtrl+,",
    click: () => onAction("openSettings"),
  };

  return [
    // macOS app menu; other platforms place these under File / Help.
    ...(isMac
      ? [
          {
            label: appName,
            submenu: [
              aboutItem,
              separator(),
              settingsItem,
              separator(),
              roleItem("hide", t("menu.hide", { appName })),
              roleItem("hideOthers", t("menu.hideOthers")),
              roleItem("unhide", t("menu.unhide")),
              separator(),
              roleItem("quit", t("menu.quitApp", { appName })),
            ],
          } satisfies MenuItemConstructorOptions,
        ]
      : []),
    {
      label: t("menu.file"),
      submenu: [
        {
          label: t("menu.import"),
          accelerator: "CmdOrCtrl+O",
          click: () => onAction("import"),
        },
        ...(isMac
          ? [roleItem("close", t("menu.closeWindow"))]
          : [
              separator(),
              settingsItem,
              separator(),
              roleItem(
                "quit",
                platform === "win32" ? t("menu.exit") : t("menu.quit"),
              ),
            ]),
      ],
    },
    {
      // Same composition as Electron's `editMenu` role, with translated labels.
      label: t("menu.edit"),
      submenu: [
        roleItem("undo", t("menu.undo")),
        roleItem("redo", t("menu.redo")),
        separator(),
        roleItem("cut", t("menu.cut")),
        roleItem("copy", t("menu.copy")),
        roleItem("paste", t("menu.paste")),
        ...(isMac
          ? [
              roleItem("pasteAndMatchStyle", t("menu.pasteAndMatchStyle")),
              roleItem("delete", t("menu.delete")),
              roleItem("selectAll", t("menu.selectAll")),
              separator(),
              {
                label: t("menu.speech"),
                submenu: [
                  roleItem("startSpeaking", t("menu.startSpeaking")),
                  roleItem("stopSpeaking", t("menu.stopSpeaking")),
                ],
              } satisfies MenuItemConstructorOptions,
            ]
          : [
              roleItem("delete", t("menu.delete")),
              separator(),
              roleItem("selectAll", t("menu.selectAll")),
            ]),
      ],
    },
    {
      // Same composition as Electron's `viewMenu` role, with translated
      // labels; the developer items exist only in development builds.
      label: t("menu.view"),
      submenu: [
        ...(devTools
          ? [
              roleItem("reload", t("menu.reload")),
              roleItem("forceReload", t("menu.forceReload")),
              roleItem("toggleDevTools", t("menu.toggleDevTools")),
              separator(),
            ]
          : []),
        roleItem("resetZoom", t("menu.resetZoom")),
        roleItem("zoomIn", t("menu.zoomIn")),
        roleItem("zoomOut", t("menu.zoomOut")),
        separator(),
        roleItem("togglefullscreen", t("menu.toggleFullScreen")),
      ],
    },
    {
      // Playback controls (Apple Music-style: between View and Window).
      label: t("menu.controls"),
      submenu: [
        {
          label: t("menu.stop"),
          accelerator: "CmdOrCtrl+.",
          enabled: state.hasTrack,
          click: () => onAction("stop"),
        },
        separator(),
        // Mode items (docs/specs/v1.5/features/controls-menu.md): always
        // enabled, and checked from the snapshot rather than toggled
        // natively, since the menu is rebuilt on every state push and the
        // Renderer's state is the single source of truth.
        {
          label: t("menu.shuffle"),
          type: "checkbox",
          checked: state.shuffle,
          click: () => onAction("toggleShuffle"),
        },
        {
          label: t("menu.repeat"),
          submenu: [
            {
              label: t("menu.repeatOff"),
              type: "radio",
              checked: state.repeat === "off",
              click: () => onAction("setRepeatOff"),
            },
            {
              label: t("menu.repeatAll"),
              type: "radio",
              checked: state.repeat === "all",
              click: () => onAction("setRepeatAll"),
            },
            {
              label: t("menu.repeatOne"),
              type: "radio",
              checked: state.repeat === "one",
              click: () => onAction("setRepeatOne"),
            },
          ],
        },
      ],
    },
    {
      // Same composition as Electron's `windowMenu` role, with translated
      // labels. `role: "window"` marks it as the macOS Window menu so the
      // system appends the window list.
      label: t("menu.window"),
      role: "window",
      submenu: [
        roleItem("minimize", t("menu.minimize")),
        roleItem("zoom", t("menu.zoom")),
        ...(isMac
          ? [separator(), roleItem("front", t("menu.front"))]
          : [roleItem("close", t("menu.closeWindow"))]),
      ],
    },
    {
      label: t("menu.help"),
      role: "help",
      submenu: isMac ? [] : [aboutItem],
    },
  ];
};
