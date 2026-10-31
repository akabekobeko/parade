import { shell } from "electron";
import { afterEach, expect, it, vi } from "vitest";
import { onOpenExternal } from "./onOpenExternal";

const event = {} as Electron.IpcMainInvokeEvent;

afterEach(() => {
  vi.restoreAllMocks();
});

it("opens an https URL in the default browser", async () => {
  const openExternal = vi.spyOn(shell, "openExternal");

  const result = await onOpenExternal(event, {
    url: "https://musicbrainz.org/",
  });

  expect(result).toEqual({ ok: true, value: undefined });
  expect(openExternal).toHaveBeenCalledWith("https://musicbrainz.org/");
});

it("refuses every other scheme without touching the shell", async () => {
  const openExternal = vi.spyOn(shell, "openExternal");

  for (const url of ["http://example.com/", "file:///etc/hosts", "smb://x/y"]) {
    const result = await onOpenExternal(event, { url });
    expect(result.ok).toBe(false);
  }
  expect(openExternal).not.toHaveBeenCalled();
});

it("reports an unparsable URL as an error", async () => {
  const result = await onOpenExternal(event, { url: "not a url" });

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error.name).toBe("TypeError");
  }
});
