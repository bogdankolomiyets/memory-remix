# Memory Remix

An interactive art project that reimagines how we engage with the voices of those we've lost.

## Quick Start

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

This generates optimized files in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
memory-remix/
├── index.html          # Main entry point
├── search.html         # Search page (in .gitignore)
├── 401.html            # Error page (in .gitignore)
├── 404.html            # Not Found page
├── js/
│   ├── main.js         # Main application logic
│   └── webflow.js      # Webflow interactions
├── css/
│   ├── memory-remix.webflow.css
│   ├── webflow.css
│   └── normalize.css
├── assets/
│   ├── covers/         # Album covers
│   ├── images/         # Images and displacement maps
│   └── music/          # Audio files
├── vite.config.js      # Vite configuration
└── package.json        # Project dependencies
```

## Technologies

- **GSAP** - Animation library with ScrollTrigger, Flip, and Draggable plugins
- **PIXI.js** - 2D WebGL renderer for canvas animations
- **Howler.js** - Audio playback library
- **Lenis** - Smooth scroll library
- **Vite** - Next generation frontend build tool

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
VITE_GH_USER=your-github-username
VITE_GH_REPO=your-repo-name
VITE_GH_BRANCH=main
```

## Git Ignore

The following files are ignored from version control:
- `search.html`
- `401.html`
- `node_modules/`
- `dist/`
- `.env.local`

## Development Notes

- **Lenis** provides smooth scrolling with custom scroll events
- **FLIP** animations handle layout transitions
- **Displacement mapping** creates the interactive background effect
- **GitHub API** fetches cover images dynamically

## License

©Copyright 2025. All Rights Reserved
