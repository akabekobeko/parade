import { join } from "node:path";
import { signApp } from "@electron/osx-sign";
import type { AfterPackContext } from "electron-builder";

/**
 * electron-builder `afterPack` hook.
 *
 * Releases are built without an Apple Developer ID, so electron-builder skips
 * code signing on macOS. An unsigned bundle still carries the linker-signed
 * signatures of the Electron binaries, and Gatekeeper treats that mix as a
 * tampered app: a quarantined copy fails with "is damaged and can't be opened"
 * and offers no way to allow it. Signing the whole bundle with the ad-hoc
 * identity ("-") turns the verdict into "unidentified developer", which the
 * user can allow from System Settings, Privacy & Security, Open Anyway.
 *
 * The signing is delegated to @electron/osx-sign (the library electron-builder
 * itself uses), which signs nested frameworks and helpers inside-out instead
 * of relying on the deprecated `codesign --deep`.
 *
 * Ordering: electron-builder runs this hook before its own signing step and
 * before it writes Electron fuses. A real identity (if one is ever configured)
 * simply replaces the ad-hoc signature. Enabling `electronFuses` in
 * electron-builder.yml would however modify the Electron Framework after this
 * seal and break it; set `resetAdHocDarwinSignature: true` there if fuses are
 * ever added.
 *
 * @param context - Packaging context passed by electron-builder.
 */
export default async function afterPack(
  context: AfterPackContext,
): Promise<void> {
  if (context.electronPlatformName !== "darwin") {
    return;
  }
  if (process.platform !== "darwin") {
    // An unsigned macOS bundle cannot be opened by the user at all, so a build
    // that cannot sign must fail instead of shipping a broken artifact.
    throw new Error("ad-hoc signing requires codesign, build macOS on macOS");
  }

  const app = join(
    context.appOutDir,
    `${context.packager.appInfo.productFilename}.app`,
  );
  console.log(`  ad-hoc signing ${app}`);
  await signApp({
    app,
    platform: "darwin",
    identity: "-",
    // "-" is not a keychain identity, skip the `security find-identity` lookup.
    identityValidation: false,
    // There is no team ID to fill into Info.plist for an ad-hoc signature.
    preAutoEntitlements: false,
    // Keep the plain signature; the hardened runtime is not needed without
    // notarization and only adds entitlement constraints.
    optionsForFile: () => ({ hardenedRuntime: false }),
  });
}
