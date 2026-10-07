# Database

`schema.sql` is the PostgreSQL schema the product is designed against. The
reference dataset that mirrors it for local development and tests lives in
`src/services/mock/seed.ts`.

## Tables

| Table | Holds |
| --- | --- |
| `languages` | Supported languages and the font family each one uses |
| `ui_translations` | Every display string, keyed by language |
| `users` | One row per person, identified by mobile number |
| `otp_challenges` | OTP issue/verify state: code hash, attempts, expiry, resend window |
| `sessions` | Server-side sessions (token hash, expiry, revocation) |
| `banks` | Banks with their emblem asset key |
| `form_types` | Bank-independent form kinds (account opening, KYC update, …) |
| `bank_forms` | A form type as offered by one bank |
| `form_versions` | One published revision of paper artwork, pinned by `artwork_hash` |
| `form_pages` | Paper size and artwork key per page of a version |
| `form_fields` | Field geometry in intrinsic page coordinates, plus label + required flag |
| `purposes` | Why the user is filling the form, scoped to one bank form |
| `purpose_field_applicability` | The reviewed (version, purpose, field) highlight matrix |
| `field_guidance` | Field guidance copy, one row per field and language |
| `user_saved_forms` | A user's form in progress or completed, per version + purpose |
| `user_field_progress` | Per-field done/pending state for a saved form |
| `user_preferences` | Language and guidance display preference per user |

## Rules the schema enforces

- **Geometry is not shared.** Coordinates live on `form_fields` under a
  `form_version_id`; nothing is stored per bank or per purpose. A new artwork
  revision means a new version row, not an edit.
- **Published versions are immutable.** Triggers reject updates or deletes on
  `form_versions`, `form_pages`, `form_fields` and
  `purpose_field_applicability` once the version is published.
- **Applicability is explicit.** The viewer highlights exactly the rows in
  `purpose_field_applicability` with `is_applicable`; there is no inference at
  runtime and no model decides what a field means.
- **Progress is per saved form**, so a user can fill the same bank form for two
  different purposes and keep two independent progress sets.

## Wiring a real backend

The client is written against interfaces in `src/services/types.ts`:

| Interface | HTTP endpoints expected |
| --- | --- |
| `AuthService` | `POST /auth/otp`, `POST /auth/otp/verify`, `POST /auth/otp/resend`, `GET /auth/session`, `POST /auth/logout` |
| `CatalogService` | `GET /banks`, `GET /banks/:id/forms`, `GET /bank-forms`, `GET /bank-forms/:id`, `GET /bank-forms/:id/purposes`, `POST /bank-forms/:id/version` |
| `FormService` | `GET /form-versions/:id/bundle?purposeId=&language=` |
| `SavedFormService` | `GET/POST /saved-forms`, `GET /saved-forms/:id`, `PUT /saved-forms/:id/progress`, `POST /saved-forms/:id/complete` |
| `PreferenceService` | `GET/PATCH /preferences` |

Set `VITE_AUTH_MODE=api` and `VITE_API_BASE_URL=https://…` to switch the app from
the in-browser development backend to these endpoints (`src/services/httpServices.ts`
is the implementation). Until that backend exists, the development backend keeps
the same interfaces, so no screen has to change.
