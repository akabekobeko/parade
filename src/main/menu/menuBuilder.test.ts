import type { MenuItemConstructorOptions } from "electron";
import { expect, it } from "vitest";
import type { MenuAction, MenuStateSnapshot } from "../ipc/types";
import { buildMenuTemplate } from "./menuBuilder";

/** Snapshot before anything played, with both modes off. */
const IDLE_STATE: MenuStateSnapshot = {
  isPlaying: false,
  hasTrack: false,
  shuffle: false,
  repeat: "off",
};

const build = (
  platform: NodeJS.Platform,
  locale: "en" | "ja" = "en",
  onAction: (action: MenuAction) => void = () => {},
  state: MenuStateSnapshot = IDLE_STATE,
  devTools = true,
) =>
  buildMenuTemplate({
    platform,
    locale,
    appName: "Parade",
    state,
    devTools,
    onAction,
  });

/** Labels (or the type of a separator) of a submenu found by its label. */
const submenuLabelsOf = (
  items: readonly MenuItemConstructorOptions[],
  label: string,
): string[] => {
  const submenu = findItem(items, label)?.submenu;
  expect(Array.isArray(submenu), `submenu of "${label}"`).toBe(true);
  return (submenu as MenuItemConstructorOptions[]).map(
    (item) => item.label ?? item.type ?? "",
  );
};

/** Depth-first search for an item by label. */
const findItem = (
  items: readonly MenuItemConstructorOptions[],
  label: string,
): MenuItemConstructorOptions | undefined => {
  for (const item of items) {
    if (item.label === label) {
      return item;
    }

    const found = Array.isArray(item.submenu)
      ? findItem(item.submenu, label)
      : undefined;
    if (found !== undefined) {
      return found;
    }
  }

  return undefined;
};

/** Find an item by label and invoke its click handler (asserting both). */
const clickItem = (
  items: readonly MenuItemConstructorOptions[],
  label: string,
): void => {
  const item = findItem(items, label);
  expect(item?.click).toBeTypeOf("function");
  (item as { readonly click: () => void }).click();
};

it("places the app menu first on macOS only", () => {
  expect(build("darwin")[0]?.label).toBe("Parade");
  expect(build("win32")[0]?.label).toBe("File");
});

it("forwards Import… clicks as the import action", () => {
  const actions: MenuAction[] = [];
  const template = build("darwin", "en", (action) => actions.push(action));
  expect(findItem(template, "Import…")?.accelerator).toBe("CmdOrCtrl+O");

  clickItem(template, "Import…");
  expect(actions).toEqual(["import"]);
});

it("routes settings and about through menu actions", () => {
  const actions: MenuAction[] = [];
  const template = build("win32", "en", (action) => actions.push(action));
  clickItem(template, "Settings…");
  clickItem(template, "About Parade");
  expect(actions).toEqual(["openSettings", "showAbout"]);
});

it("puts about into the app menu on macOS and Help elsewhere", () => {
  const mac = build("darwin");
  const win = build("win32");
  const macHelp = mac.find((item) => item.role === "help");
  const winHelp = win.find((item) => item.role === "help");
  expect(macHelp?.submenu).toEqual([]);
  expect(
    findItem([winHelp as MenuItemConstructorOptions], "About Parade"),
  ).toBeDefined();
  expect(findItem(mac, "About Parade")).toBeDefined();
});

it("forwards Controls > Stop clicks as the stop action", () => {
  const actions: MenuAction[] = [];
  const template = build("darwin", "en", (action) => actions.push(action), {
    ...IDLE_STATE,
    isPlaying: true,
    hasTrack: true,
  });
  expect(findItem(template, "Stop")?.accelerator).toBe("CmdOrCtrl+.");

  clickItem(template, "Stop");
  expect(actions).toEqual(["stop"]);
});

it("gates Controls > Stop on hasTrack", () => {
  const withoutTrack = build("darwin");
  expect(findItem(withoutTrack, "Stop")?.enabled).toBe(false);

  const withTrack = build("darwin", "en", () => {}, {
    ...IDLE_STATE,
    hasTrack: true,
  });
  expect(findItem(withTrack, "Stop")?.enabled).toBe(true);
});

it("checks Controls > Shuffle from the snapshot and forwards toggleShuffle", () => {
  const actions: MenuAction[] = [];
  const off = build("darwin", "en", (action) => actions.push(action));
  const shuffle = findItem(off, "Shuffle");
  expect(shuffle?.type).toBe("checkbox");
  expect(shuffle?.checked).toBe(false);
  expect(shuffle?.enabled).toBeUndefined();

  const on = build("darwin", "en", () => {}, { ...IDLE_STATE, shuffle: true });
  expect(findItem(on, "Shuffle")?.checked).toBe(true);

  clickItem(off, "Shuffle");
  expect(actions).toEqual(["toggleShuffle"]);
});

it("checks exactly one Controls > Repeat radio item from the snapshot", () => {
  const checkedLabelsOf = (repeat: MenuStateSnapshot["repeat"]): string[] => {
    const template = build("darwin", "en", () => {}, { ...IDLE_STATE, repeat });
    const submenu = findItem(template, "Repeat")?.submenu;
    expect(Array.isArray(submenu)).toBe(true);
    const items = submenu as MenuItemConstructorOptions[];
    expect(items.every((item) => item.type === "radio")).toBe(true);
    return items
      .filter((item) => item.checked === true)
      .map((item) => item.label ?? "");
  };
  expect(checkedLabelsOf("off")).toEqual(["Off"]);
  expect(checkedLabelsOf("all")).toEqual(["All"]);
  expect(checkedLabelsOf("one")).toEqual(["One"]);
});

it("forwards the Controls > Repeat items as the three setRepeat actions", () => {
  const actions: MenuAction[] = [];
  const template = build("win32", "en", (action) => actions.push(action));
  clickItem(template, "Off");
  clickItem(template, "All");
  clickItem(template, "One");
  expect(actions).toEqual(["setRepeatOff", "setRepeatAll", "setRepeatOne"]);
});

it("places the mode items after Stop behind a separator", () => {
  const submenu = findItem(build("darwin"), "Controls")?.submenu;
  expect(Array.isArray(submenu)).toBe(true);
  const labels = (submenu as MenuItemConstructorOptions[]).map(
    (item) => item.label ?? item.type,
  );
  expect(labels).toEqual(["Stop", "separator", "Shuffle", "Repeat"]);
});

it("localises the mode items", () => {
  const template = build("win32", "ja");
  expect(findItem(template, "シャッフル")?.type).toBe("checkbox");
  expect(findItem(template, "リピート")).toBeDefined();
  expect(findItem(template, "1 曲")?.type).toBe("radio");
});

it("places Controls between View and Window", () => {
  const labels = build("win32").map((item) => item.label ?? item.role);
  const controls = labels.indexOf("Controls");
  expect(controls).toBeGreaterThan(labels.indexOf("View"));
  expect(labels[controls + 1]).toBe("Window");
});

it("spells out the Edit menu like Electron's editMenu role, per platform", () => {
  expect(submenuLabelsOf(build("darwin"), "Edit")).toEqual([
    "Undo",
    "Redo",
    "separator",
    "Cut",
    "Copy",
    "Paste",
    "Paste and Match Style",
    "Delete",
    "Select All",
    "separator",
    "Speech",
  ]);
  expect(submenuLabelsOf(build("win32"), "Edit")).toEqual([
    "Undo",
    "Redo",
    "separator",
    "Cut",
    "Copy",
    "Paste",
    "Delete",
    "separator",
    "Select All",
  ]);
});

it("keeps the role on every standard item so the behaviour stays native", () => {
  const template = build("darwin");
  expect(findItem(template, "Undo")?.role).toBe("undo");
  expect(findItem(template, "Paste and Match Style")?.role).toBe(
    "pasteAndMatchStyle",
  );
  expect(findItem(template, "Zoom In")?.role).toBe("zoomIn");
  expect(findItem(template, "Toggle Full Screen")?.role).toBe(
    "togglefullscreen",
  );
  expect(findItem(template, "Minimize")?.role).toBe("minimize");
  expect(findItem(template, "Bring All to Front")?.role).toBe("front");
  expect(findItem(template, "Hide Parade")?.role).toBe("hide");
  expect(findItem(template, "Quit Parade")?.role).toBe("quit");
  expect(findItem(template, "Close Window")?.role).toBe("close");
  expect(findItem(build("win32"), "Exit")?.role).toBe("quit");
  // Linux keeps the GTK wording, like Electron's own quit role.
  expect(findItem(build("linux"), "Quit")?.role).toBe("quit");
  expect(findItem(build("linux"), "Exit")).toBeUndefined();
});

it("translates the standard items with the app locale, not the OS", () => {
  const template = build("darwin", "ja");
  expect(findItem(template, "取り消す")?.role).toBe("undo");
  expect(findItem(template, "ペースト")?.role).toBe("paste");
  expect(findItem(template, "拡大")?.role).toBe("zoomIn");
  expect(findItem(template, "しまう")?.role).toBe("minimize");
  expect(findItem(template, "Parade を終了")?.role).toBe("quit");
  expect(submenuLabelsOf(template, "表示")).not.toContain("Reload");

  const win = build("win32", "ja");
  expect(submenuLabelsOf(win, "編集")).toEqual([
    "取り消す",
    "やり直す",
    "separator",
    "カット",
    "コピー",
    "ペースト",
    "削除",
    "separator",
    "すべてを選択",
  ]);
  expect(submenuLabelsOf(win, "ウィンドウ")).toEqual([
    "しまう",
    "拡大 / 縮小",
    "ウィンドウを閉じる",
  ]);
  expect(findItem(win, "終了")?.role).toBe("quit");
});

it("includes Reload / Force Reload / Toggle Developer Tools only when devTools is on", () => {
  expect(submenuLabelsOf(build("darwin"), "View")).toEqual([
    "Reload",
    "Force Reload",
    "Toggle Developer Tools",
    "separator",
    "Actual Size",
    "Zoom In",
    "Zoom Out",
    "separator",
    "Toggle Full Screen",
  ]);
  const release = build("darwin", "en", () => {}, IDLE_STATE, false);
  expect(submenuLabelsOf(release, "View")).toEqual([
    "Actual Size",
    "Zoom In",
    "Zoom Out",
    "separator",
    "Toggle Full Screen",
  ]);
  expect(findItem(release, "Reload")).toBeUndefined();
  expect(findItem(release, "Force Reload")).toBeUndefined();
  expect(findItem(release, "Toggle Developer Tools")).toBeUndefined();
});

it("marks Window as the macOS window menu and closes on other platforms", () => {
  const mac = findItem(build("darwin"), "Window");
  expect(mac?.role).toBe("window");
  expect(submenuLabelsOf(build("darwin"), "Window")).toEqual([
    "Minimize",
    "Zoom",
    "separator",
    "Bring All to Front",
  ]);
  expect(submenuLabelsOf(build("win32"), "Window")).toEqual([
    "Minimize",
    "Zoom",
    "Close Window",
  ]);
});

it("localises the labels from the shared dictionaries", () => {
  const template = build("win32", "ja");
  expect(template[0]?.label).toBe("ファイル");
  expect(findItem(template, "インポート…")).toBeDefined();
});
