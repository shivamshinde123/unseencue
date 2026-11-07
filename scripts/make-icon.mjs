// Renders build/icon.svg into the app icon set:
//   build/icon.png (1024), build/icon.ico (16–256, used for the exe, installer and shortcuts),
//   renderer/icon.png (256, window/taskbar icon), site/assets/icon-*.png (website/README).
// Run: npm run icon
import { readFile, writeFile, mkdir } from "node:fs/promises";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const svg = await readFile("build/icon.svg");
const png = (size) => sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();

await mkdir("build", { recursive: true });
await writeFile("build/icon.png", await png(1024));
await writeFile("renderer/icon.png", await png(256));
await mkdir("site/assets", { recursive: true });
await writeFile("site/assets/icon-512.png", await png(512));
await writeFile("site/assets/icon-180.png", await png(180));
await writeFile("site/assets/icon-32.png", await png(32));

const sizes = [16, 20, 24, 32, 40, 48, 64, 128, 256];
await writeFile("build/icon.ico", await pngToIco(await Promise.all(sizes.map(png))));
console.log("icons written:", sizes.join(", "));
