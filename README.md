# Sandbox apps

This repository hosts a couple of lightweight, static web utilities:

- **Photo Canvas Builder** – assemble collage-style canvases from your own photos.
- **Functional Safety Certification Tracker** – follow functional safety certification status across projects without needing spreadsheets.

## Photo Canvas Builder

Static web experience for assembling a collage-style canvas with your own photos. Users can pick from a few starter templates, tweak spacing/background/corner radius, drop in up to four images, and export the montage as a PNG—no frameworks or build tooling required.

### Project structure

```
photo-canvas/
├── index.html   # layout and markup
├── styles.css   # visual design tokens and layout rules
└── app.js       # vanilla JS logic for previews + canvas export
```

### Run locally

1. Open `photo-canvas/index.html` in any modern browser. (You can also serve the folder with a simple static server such as `python -m http.server` if you prefer.)
2. No dependencies or build steps are required.

## Functional Safety Certification Tracker

A standalone tracker that captures certification progress, ownership, and audit dates for each project. Data is stored in the browser so you can prototype flows before wiring to a backend.

### Features

- Quick filters by status and a search box for project, owner, or organization.
- Inline actions to mark "check today," edit records, or remove completed items.
- Form to add or update projects with safety level, workstream, certification body, and notes.
- Local storage for persistence between sessions.

### Project structure

```
fs-cert-tracker/
├── index.html  # interface and layout
├── styles.css  # dark UI with badges and table styling
└── app.js      # filtering, CRUD actions, and localStorage persistence
```

### Run locally

1. Open `fs-cert-tracker/index.html` directly in a browser.
2. Use the form at the bottom of the page to add new projects or edit an existing one.
3. Data is kept locally in the browser; export snapshots manually for audits.

## Deploy to GitHub Pages

Because everything is static, deployment to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, etc.) works the same way—just point it at the folder you want to publish.
