# Thunaiy — Frontend baseline

Figma-to-code build of the Thunaiy mobile UI (tagline: "Your Guide. Every Step."). Source of truth: Figma file `xTZpYYx2MvpQCgmejKPUGE`.
React + TypeScript + Vite + Tailwind CSS v3. No backend, auth, OTP, APIs, AI or OCR.

## Run

```bash
npm install        # also creates package-lock.json (commit it)
npm run assets:check
npm run dev
npm run build
```

## Assets you must copy from Figma (not included)

The Figma asset URLs could not be downloaded when this project was generated. Every icon, logo and bank emblem is
referenced by its Figma export id and loaded from `public/assets/figma/<id>.<ext>`. Until the files exist, each slot
renders empty at its exact size, so layout is unaffected.

`assets-manifest.json` lists all 73 files with their Figma frames, slot sizes and usage. `npm run assets:check` prints what is still missing.
Note: `thunai-app-logo.jpeg` (header slot on Home, Forms, Settings) exports no image data in Figma; copy it from the layer manually.

## Routes (11 Figma frames)

`/register` `/otp` `/language` `/bank` `/form` `/purpose` `/viewer` `/complete` `/home` `/forms` `/settings`

Figma contains no prototype links, so flow wiring is the obvious primary path only. Nothing in the Viewer links to `/complete`
(Figma has no control for it); open it by URL or connect it in the next phase.
Settings rows Help & Support, Privacy Policy, Terms of Use, About Thunaiy and Log out are intentionally non-navigating, as in Figma.

## Structure

```
src/
  components/        shared UI (FigmaImg, AppHeader, BottomNav, Cta, ...)
  pages/             one file per Figma frame
  features/viewer/   data-driven form viewer
  data/              mock banks, forms, purposes, languages, user
  assets/figmaAssets.ts   registry of Figma assets (id, size)
```

## Form viewer

`FormDocument` (types.ts) = bank, form, version, pages, fields `{id, page, x, y, width, height, applicable, required}`.
Each page is drawn at its intrinsic size and scaled as one unit (`FormPageFrame`), with `HighlightOverlay` between the sheet and the
artwork, so highlights cannot drift. Add a bank/form by adding a document and registering its artwork in `artwork.tsx`.
Zoom/pan are not wired (`useViewerZoom` and `ViewerControls` are the extension points).

## Deviations from Figma

- Telugu and Kannada use Noto Sans (Figma export shows missing glyphs); Tamil and Hindi use Noto Sans with FreeSans fallback.
- Form mock monospace uses Cousine (metric-compatible with Liberation Mono).
- OTP screen is the static sample state from Figma.
- Layout is fluid up to 430px wide; the Purpose list is 346.94px wide at 390px as in Figma and never overflows narrower screens.
