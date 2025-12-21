# Memory Remix Widget — Webflow Integration Guide

## Overview

Memory Remix is a React-based audio recording and mixing widget that allows users to:
- Upload audio tracks (MP3/WAV)
- Record voice over the track
- Add drum beats (kick, snare, hi-hat) with metronome
- Adjust volume and pitch
- Export the final mix as MP3 (~5-6MB for 5-6 min track)

---

## Required Files

Upload these files to your Webflow project or CDN:

| File | Location | Description |
|------|----------|-------------|
| `dist/bundle.js` | `/dist/bundle.js` | Main widget code (~569KB) |
| `dist/assets/style.css` | `/dist/assets/style.css` | Widget styles (~20KB) |
| `assets/samples/*.mp3` | `/assets/samples/` | Drum samples (kick, snare, hihat) |

---

## HTML Integration

### 1. Add Dependencies (in `<head>` or before `</body>`)

```html
<!-- React 18 (required, must load BEFORE bundle.js) -->
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>

<!-- Widget Styles -->
<link href="./dist/assets/style.css" rel="stylesheet" type="text/css">
```

### 2. Add Mount Container

Place this `<div>` where you want the widget to appear:

```html
<div 
  id="memory-remix"
  data-kick-url="./assets/samples/TR-808_Kick.mp3"
  data-snare-url="./assets/samples/TR-808_Snare.mp3"
  data-hihat-url="./assets/samples/TR-808_HiHat.mp3"
  data-debug="false"
></div>
```

### 3. Load Widget Script (AFTER React)

```html
<script src="./dist/bundle.js"></script>
```

---

## Configuration Attributes

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `id` | ✅ Yes | `memory-remix` | Container ID (must be exactly this) |
| `data-kick-url` | ✅ Yes | — | URL to kick drum sample (MP3) |
| `data-snare-url` | ✅ Yes | — | URL to snare drum sample (MP3) |
| `data-hihat-url` | ✅ Yes | — | URL to hi-hat drum sample (MP3) |
| `data-debug` | ❌ No | `false` | Show latency debug panel |

---

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Memory Remix</title>
  
  <!-- Widget Styles -->
  <link href="./dist/assets/style.css" rel="stylesheet">
</head>
<body>

  <!-- Widget Container -->
  <div 
    id="memory-remix"
    data-kick-url="https://your-cdn.com/samples/kick.mp3"
    data-snare-url="https://your-cdn.com/samples/snare.mp3"
    data-hihat-url="https://your-cdn.com/samples/hihat.mp3"
  ></div>

  <!-- Dependencies -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <!-- Widget -->
  <script src="./dist/bundle.js"></script>

</body>
</html>
```

---

## Webflow-Specific Notes

### Script Loading Order

In Webflow's custom code section, ensure this order:

1. **Head Code** (Project Settings → Custom Code → Head):
```html
<link href="./dist/assets/style.css" rel="stylesheet" type="text/css">
```

2. **Footer Code** (Project Settings → Custom Code → Footer):
```html
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="./dist/bundle.js"></script>
```

### Container Setup

The widget expects a container with **fixed dimensions**. Recommended parent styles:

```css
.music-creation-content-wrapper {
  width: 100%;
  min-height: 600px;
  display: flex;
  justify-content: center;
  align-items: center;
}
```

---

## Supabase Integration

The widget includes submission functionality that requires Supabase. The configuration is in:
- `src/supabaseClient.js` — Supabase URL and anon key

Submissions are stored in:
- **Storage Bucket**: `audios` (public folder)
- **Database Table**: `submissions`

---

## Audio Export Details

| Format | Size (5 min track) | Quality |
|--------|-------------------|---------|
| MP3 | ~5-6 MB | 128kbps stereo |
| WAV (fallback) | ~60 MB | 16-bit PCM |

- **Timeout**: If MP3 encoding exceeds 60 seconds, automatically falls back to WAV
- **Processing UI**: Shows spinner and "PROCESSING" text during export

---

## Browser Support

| Browser | Supported |
|---------|-----------|
| Chrome 80+ | ✅ |
| Firefox 75+ | ✅ |
| Safari 14+ | ✅ |
| Edge 80+ | ✅ |
| Mobile browsers | ⚠️ Limited (microphone access varies) |

---

## Troubleshooting

### Widget Not Appearing
1. Check if `#memory-remix` div exists in DOM
2. Verify React scripts load BEFORE bundle.js
3. Check browser console for errors

### Audio Not Playing
1. User must interact with page first (browser autoplay policy)
2. Check sample URLs are accessible (CORS)

### Microphone Not Working
1. Site must be served over HTTPS
2. User must grant microphone permission
3. Check if another app is using the microphone

---

## Development

```bash
# Install dependencies
npm install

# Development server (with hot reload)
npm run dev

# Production build
npm run build
```

Output files are in `dist/` folder.

---

## Contact

For technical issues, contact the development team.
