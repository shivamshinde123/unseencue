import { Composition } from "remotion";
import { Promo, TOTAL_FRAMES } from "./Promo";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition id="UnseencuePromo" component={Promo} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
  );
};
