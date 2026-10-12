import { expect, it, vi } from "vitest";
import { reportFavoriteFailure } from "./reportFavoriteFailure";

it("stays silent on success", async () => {
  const report = vi.fn();
  await reportFavoriteFailure(Promise.resolve(null), report);
  expect(report).not.toHaveBeenCalled();
});

it("reports the IPC error's message", async () => {
  const report = vi.fn();
  await reportFavoriteFailure(
    Promise.resolve({ name: "Error", message: "boom" }),
    report,
  );
  expect(report).toHaveBeenCalledWith("boom");
});

it("reports a rejected invoke instead of leaving it unhandled", async () => {
  const report = vi.fn();
  await reportFavoriteFailure(Promise.reject(new Error("no handler")), report);
  expect(report).toHaveBeenCalledWith("no handler");
});

it("stringifies a non-Error rejection reason", async () => {
  const report = vi.fn();
  await reportFavoriteFailure(Promise.reject("offline"), report);
  expect(report).toHaveBeenCalledWith("offline");
});
