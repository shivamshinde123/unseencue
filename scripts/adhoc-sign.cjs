// electron-builder afterPack hook: ad-hoc sign the macOS app ("codesign --sign -").
// Free, no Apple account needed. Apple Silicon refuses to run apps with no valid signature, and
// packaging edits Electron's bundle (name, Info.plist, icon), which breaks its original signature.
// Users still see Gatekeeper's "unidentified developer" prompt the first time (right-click → Open).
const { execFileSync } = require("node:child_process");
const path = require("node:path");

exports.default = async function adhocSign(context) {
  if (context.electronPlatformName !== "darwin") return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  console.log(`  • ad-hoc signing  ${app}`);
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", "--timestamp=none", app], { stdio: "inherit" });
  execFileSync("codesign", ["--verify", "--deep", "--strict", app], { stdio: "inherit" });
};
