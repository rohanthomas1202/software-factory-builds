# Audio Assets — public/sounds/

## alert.mp3

This directory requires an `alert.mp3` file for the countdown completion sound.
The app ships with a **Web Audio API synthesised fallback** that plays automatically
when `alert.mp3` is absent, so the app is **fully functional without this file**.

---

### File Specifications

| Property     | Required Value          |
|--------------|-------------------------|
| Format       | MP3 (MPEG Layer 3)      |
| Duration     | 1–3 seconds             |
| File size    | < 50 KB                 |
| Sample rate  | 44,100 Hz               |
| Channels     | Mono or Stereo          |
| Bit rate     | 128 kbps maximum        |
| Character    | Pleasant chime/bell tone |

---

### How to add alert.mp3

**Option A — Download a free chime (recommended):**

```
# Freesound.org (CC0 licensed chimes):
# https://freesound.org/search/?q=chime&filter=duration%3A%5B0+TO+3%5D&license=Creative+Commons+0

# After download, convert to MP3 if needed:
ffmpeg -i input.wav -codec:a libmp3lame -b:a 128k -ar 44100 public/sounds/alert.mp3
```

**Option B — Generate synthetically (Node.js):**

```bash
# Install dependencies
npm install --save-dev node-web-audio-api

# Run the generator script
node public/sounds/generate-alert.mjs
```

**Option C — Use ffmpeg to generate a sine-wave chime:**

```bash
# Two-tone chime: 880Hz → 1100Hz, 1.5s total, fade out
ffmpeg -f lavfi \
  -i "sine=frequency=880:duration=0.6,sine=frequency=1100:duration=0.6" \
  -filter_complex "[0:a][1:a]concat=n=2:v=0:a=1,afade=t=out:st=0.9:d=0.6" \
  -b:a 128k -ar 44100 \
  public/sounds/alert.mp3

# Or a simple single-tone bell (440Hz, 1.5s, with fade):
ffmpeg -f lavfi \
  -i "sine=frequency=1046.5:duration=1.5" \
  -af "afade=t=in:st=0:d=0.05,afade=t=out:st=1.0:d=0.5" \
  -b:a 128k -ar 44100 \
  public/sounds/alert.mp3
```

**Option D — Use the included browser-console helper:**

Open your browser DevTools console on any page and paste the contents of
`public/sounds/alert-fallback.js` to hear the synthesised chime and
verify it matches your expectations.

---

### Web Audio API Fallback (no file needed)

`src/hooks/useAudioAlert.ts` implements a multi-strategy audio alert:

1. **HTMLAudioElement** backed by `/sounds/alert.mp3` (preferred)
2. **Web Audio API** synthesised chime (automatic fallback when MP3 is missing)
3. **Silent no-op** (SSR or both APIs unavailable)

The synthesised chime uses:
- Oscillator type: `sine`
- Frequencies: 880 Hz → 1100 Hz → 1320 Hz (ascending major triad)
- Duration: ~1.5 seconds with exponential gain envelope (attack + release)
- Gain: 0.4 (moderate — not jarring)

---

### Licensing Note

If you source `alert.mp3` from an external library, ensure it is licensed
for commercial use or falls under Creative Commons Zero (CC0). Recommended
sources:

- [Freesound.org](https://freesound.org/) — filter by CC0
- [Pixabay Sound Effects](https://pixabay.com/sound-effects/) — royalty-free
- [ZapSplat](https://www.zapsplat.com/) — free with attribution (Standard License)