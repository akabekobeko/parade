import { shell } from "electron";

/**
 * Open a link from the renderer in the user's default browser.
 *
 * Only `https:` URLs are accepted: the renderer is sandboxed and must not be
 * able to launch arbitrary protocol handlers (`file:`, `smb:`, custom
 * schemes) through the app. Shared by the `mp:app:openExternal` handler and
 * the window's navigation guards in `main.ts`.
 *
 * @param raw - The URL as received from the renderer.
 * @throws `TypeError` when `raw` is not a URL, `Error` for a non-https scheme.
 */
export const openExternalHttps = async (raw: string): Promise<void> => {
  const url = new URL(raw);
  if (url.protocol !== "https:") {
    throw new Error(`Refused to open a non-https URL: ${raw}`);
  }

  await shell.openExternal(url.href);
};
