# Unseencue product video

A ~2-minute promo for [Unseencue](https://github.com/shivamshinde123/unseencue), built with [Remotion](https://www.remotion.dev).

```bash
npm install
python scripts/voiceover.py   # Andrew neural voice + word timings → public/voiceover/, src/voiceover.json (pip install edge-tts)
python scripts/music.py       # original ambient bed → public/music/ambient.wav (numpy)
npx remotion studio           # preview / edit
npx remotion render src/index.ts UnseencuePromo out/unseencue-promo.mp4
node scripts/stills.mjs <dir> 60 552 1206   # render review frames
```

- `src/Promo.tsx`: scene order, lengths, transitions, music ducking
- `src/scenes/`: one component per scene
- `src/components/`: teleprompter, captions, monitor, icons
- `src/theme.ts`: design tokens shared with the app and website
