import { expect, it } from "vitest";
import { onGetVersions } from "./onGetVersions";

// `APP_VERSION` wraps the Vite `define` constant `__APP_VERSION__`, which
// vitest.config.ts sets to "0.0.0-test".
const event = {} as Electron.IpcMainInvokeEvent;

it("returns an ok IpcResult with the runtime versions", async () => {
  const result = await onGetVersions(event);

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.app).toBe("0.0.0-test");
    expect(result.value.node).toBe(process.versions.node);
    expect(typeof result.value.electron).toBe("string");
    expect(typeof result.value.chrome).toBe("string");
  }
});
