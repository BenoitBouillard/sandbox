# Photo Canvas Builder

Static web experience for assembling a collage-style canvas with your own photos. Users can pick from a few starter templates, tweak spacing/background/corner radius, drop in up to four images, and export the montage as a PNG—no frameworks or build tooling required.

## Project structure

```
photo-canvas/
├── index.html   # layout and markup
├── styles.css   # visual design tokens and layout rules
└── app.js       # vanilla JS logic for previews + canvas export
```

## Run locally

1. Clone this repository.
2. Open `photo-canvas/index.html` in any modern browser. (You can also serve the folder with a simple static server such as `python -m http.server` if you prefer.)

No dependencies or build steps are required.

## Deploy to GitHub Pages

1. Commit the files in this repo to a GitHub repository.
2. In the repo settings, enable **Pages** and set the source to the `main` branch (or a dedicated `gh-pages` branch) with the root folder.
3. Once Pages finishes building, visit the published URL to use the tool online.

Because everything is static, deployment to any other static host (Netlify, Vercel, Cloudflare Pages, etc.) works the same way—just point it at the `photo-canvas` directory.
