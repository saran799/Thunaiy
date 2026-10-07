# Thunaiy

Mobile-first guidance for Indian bank forms. Tagline: "Your Guide. Every Step."
Visual baseline: the Figma build in `54b8ca1` (`xTZpYYx2MvpQCgmejKPUGE`), preserved as-is.
React 18 + TypeScript (strict) + Vite + Tailwind CSS v3.

## Run

```bash
npm install
cp .env.example .env.local     # optional: dev backend works with no .env
npm run assets:check
npm run dev                    # http://localhost:5173
npm run verify                 # typecheck + tests + production build
```

Individual scripts: `npm run typecheck`, `npm run test`, `npm run build`.

## What works today

Full path: **register → OTP → language → bank → form → purpose → viewer → complete**,
plus **home**, **forms** and **settings**.

- **State** (`src/state/`) — session, bank/form/purpose selections, language and
  guidance preference persist to `localStorage`, so selections survive navigation
  and reloads. A stored session token is revalidated on start-up.
- **Auth** (`src/services/mock/mockAuthService.ts`) — real OTP inputs, resend with
  cooldown, attempt limits and expiry, session issue/restore/logout and protected
  routes. See *Development authentication* below.
- **Catalogue** (`src/services/`) — banks, bank forms, purposes and form versions
  come from services, not constants in screens. The viewer resolves
  bank + form + purpose + version; nothing about SBI is hardcoded in a screen.
- **Guidance engine** (`src/features/viewer/resolve.ts`) — applicability is a
  per-purpose structure (`purpose_field_applicability`), not a boolean on the
  field. Highlighting, required counts, guidance copy and progress all follow from
  the resolved document.
- **Viewer** — zoom in/out, Fit, page tracking with a truthful page indicator,
  correct title, field tap targets, guidance sheet, per-field progress.
- **Saved forms** — continuing a form restores its context; completion is stored
  and shown on Home and the completion screen.
- **i18n** (`src/i18n/`) — English, Tamil, Hindi, Telugu, Kannada with full key
  parity (enforced by `tsc` and by a test), persisted, applied app-wide, and the
  script font switched per language. Tamil is one language among five.

## Development authentication

There is no SMS provider in this build. `VITE_AUTH_MODE=dev` (the default) selects
an **in-browser development backend**: codes are generated, hashed, counted and
expired locally, and the code is shown on the OTP screen and printed to the
console so the flow can be exercised.

**This is not production authentication.** A client-side "backend" cannot enforce
attempt limits, expiry or session revocation against an attacker; it exists so the
product can be built and demonstrated. Point `VITE_AUTH_MODE=api` at a real backend
(same interfaces, `src/services/httpServices.ts`) for production; see
`db/schema.sql` for the tables such a backend needs, including `otp_challenges`
(one-time, attempt-limited, hashed) and `sessions` (revocable).

The session token is currently persisted in `localStorage` so the user stays
signed in across reloads. With the HTTP backend, prefer an httpOnly, `Secure`,
`SameSite` session cookie issued by the API and drop the token from client state
(the state shape carries the token only because the development backend needs it).

## Database

`db/schema.sql` (PostgreSQL) is the schema of record: banks, form types, bank
forms, form versions, pages, fields, purposes, per-purpose field applicability,
localised guidance, saved forms, per-field progress and preferences. Published
form versions are immutable by trigger; geometry is stored per version, never
per form or per bank. `db/README.md` maps each table to the client interfaces and
lists the endpoints a real API must expose.

## Form viewer architecture

`FormDocument` = bank + form + version + purpose + pages + resolved fields
`{id, page, x, y, width, height, applicable, required, guidance, progress}`.
Each page is drawn at its intrinsic size and scaled as one unit
(`FormPageFrame`), with `HighlightOverlay` between the sheet and the artwork, so
highlights cannot drift. Tap targets sit in an invisible layer above the artwork,
which is why field selection does not change the approved visuals. To add a
bank form, add its seed rows (pages, fields, purposes, applicability, guidance)
and register its artwork in `features/viewer/artwork.tsx`.

## Tests

```bash
npm run test
```

`src/__tests__/` covers:

- **Catalogue** — bank selection and form filtering, purpose filtering, directory search data.
- **Guidance** — purpose → field applicability per purpose, required counts, document
  resolution, versions without artwork, guidance language fallback.
- **Auth** — validation, expiry, attempt limits, resend cooldown, logout, session restore.
- **State** — selection reset rules, preference retention, persisted-state parsing.
- **Screens** — protected routes, registration → OTP → language, home (saved forms,
  continue, empty state), settings (language, guidance, logout), the viewer
  (highlight count per purpose, field guidance, progress persistence, zoom/Fit,
  page tracking, guidance-off) and i18n key parity.
- **`smoke.test.tsx`** — the whole journey (register → … → complete → home) against the
  shipped service registry and persisted state, including a reload.

## Assets you must copy from Figma (not included)

The 73 Figma asset URLs could not be downloaded when this project was generated,
and `public/assets/figma/` is still empty. Every icon, logo and bank emblem is
referenced by its Figma export id and loaded from `public/assets/figma/<id>.<ext>`
through `src/assets/figmaAssets.ts`; until the files exist each slot renders empty
at its exact size, so layout is unaffected. `assets-manifest.json` lists all 73
files with their frames, slot sizes and usage, and `npm run assets:check` prints
what is missing. `thunai-app-logo.jpeg` (header slot on Home, Forms, Settings)
exports no image data in Figma; copy it from the layer manually.

## Structure

```
src/
  app/               providers (services, state, i18n, session) + route guard
  components/        shared UI (FigmaImg, AppHeader, BottomNav, Cta, ...)
  domain/            entity types, languages, validation
  features/viewer/   document resolution, artwork registry, viewer UI
  hooks/             useAsync (loading/error/retry for every screen)
  i18n/              catalogues + runtime
  pages/             one file per Figma frame
  services/          interfaces, HTTP implementation, development backend
  state/             persisted app state
  test/              vitest setup shims and fixtures
db/                  PostgreSQL schema + notes
scripts/             check-assets.mjs
```

## Known limitations

- The 73 Figma assets are still missing (see above); every icon slot is empty.
- Only one form version has measured geometry: **SBI Account Opening Form**
  (`SBI-AOF-VER4-DEC2023`). Other bank forms exist in the catalogue and their
  screens work, but the viewer shows the "not available yet" state until their
  artwork and coordinates are measured. Fields for those forms are not invented.
- The reading of the guidance sheet, progress and completion are implemented
  without a Figma frame for that panel; they reuse the existing design language
  (radii, shadow, navy/teal/cyan tokens) and add no new colours.
- Guidance copy is hand-written seed data in five languages and has not been
  reviewed by a bank or a legal reviewer.
- No SMS provider, no production backend and no admin/authoring tool are included;
  the schema and service interfaces are the seams for them.
