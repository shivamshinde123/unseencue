import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";

const dm = loadDMSans("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });
loadDMSans("italic", { weights: ["400"], subsets: ["latin"] });
const geist = loadGeist("normal", { weights: ["500", "600"], subsets: ["latin"] });

// Same tokens as the app and website ("Dimension" style).
export const T = {
  void: "#0a0a0a",
  graphite: "#161616",
  frost: "rgba(212, 212, 212, 0.1)",
  snow: "#ffffff",
  bone: "#ededed",
  ash: "#c2c2c2",
  smoke: "#b2b2b2",
  slate: "#686868",
  hairline: "rgba(229, 229, 229, 0.14)",
  hairlineStrong: "rgba(229, 229, 229, 0.28)",
  violet: "107, 98, 242",
  gold: "#ffd166",
  sky: "#4cc9f0",
  mint: "#90be6d",
  rose: "#ff4d6d",
  ui: `${dm.fontFamily}, "Segoe UI", sans-serif`,
  head: `${geist.fontFamily}, ${dm.fontFamily}, sans-serif`,
} as const;

// The sunset-to-cobalt "horizon" used for the reveal and the ending.
export const HORIZON = [
  "radial-gradient(55% 70% at 8% 100%, rgba(255, 150, 90, .55), transparent 62%)",
  "radial-gradient(60% 80% at 95% 95%, rgba(52, 86, 230, .65), transparent 65%)",
  "radial-gradient(40% 40% at 55% 0%, rgba(107, 98, 242, .25), transparent 70%)",
  "linear-gradient(180deg, #0d0c13 0%, #15131f 50%, #221b36 100%)",
].join(", ");

export const WASH = `linear-gradient(90deg, transparent, rgba(${T.violet}, .565) 50%, transparent)`;
