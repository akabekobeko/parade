import { expect, it, vi } from "vitest";
import { SettingsDialogStore } from "./settingsDialogStore";

it("starts closed and toggles through open / close", () => {
  const store = new SettingsDialogStore();
  expect(store.getSnapshot()).toBe(false);

  store.open();
  expect(store.getSnapshot()).toBe(true);

  store.close();
  expect(store.getSnapshot()).toBe(false);
});

it("notifies listeners only when the state changes", () => {
  const store = new SettingsDialogStore();
  const listener = vi.fn();
  store.subscribe(listener);

  store.open();
  store.open();
  expect(listener).toHaveBeenCalledTimes(1);

  store.close();
  store.close();
  expect(listener).toHaveBeenCalledTimes(2);
});

it("stops notifying after unsubscribe", () => {
  const store = new SettingsDialogStore();
  const listener = vi.fn();
  const unsubscribe = store.subscribe(listener);

  unsubscribe();
  store.open();
  expect(listener).not.toHaveBeenCalled();
});
