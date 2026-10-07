-- =============================================================================
-- Thunaiy — PostgreSQL schema (v1)
-- =============================================================================
-- Design rules enforced here:
--
--  1. A form's geometry belongs to one *published version* of one bank form.
--     Published versions are immutable: corrections are published as a new
--     version (see the guard triggers at the bottom of this file).
--  2. Every row that the viewer highlights is derived from
--     `purpose_field_applicability` — an explicit, reviewed (form_version,
--     purpose, field) row. Applicability is never inferred at runtime.
--  3. Purpose-specific guidance text lives in `field_guidance`, one row per
--     (field, language). The UI never holds guidance copy.
--  4. Display strings for catalogue entities are translation keys; the copy
--     itself is in `ui_translations`, so adding a language is a data change.
--
-- The in-browser development backend mirrors this schema exactly; the seed in
-- `src/services/mock/seed.ts` is the reference dataset for local development.
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- languages --
create table languages (
  code            text primary key,                 -- 'en', 'ta', 'hi', 'te', 'kn'
  endonym         text not null,                    -- shown in the language picker
  english_name    text not null,
  font_family     text not null,                    -- CSS family applied when active
  is_active       boolean not null default true,
  sort            integer not null default 0
);

-- --------------------------------------------------------- ui translations --
create table ui_translations (
  id              bigserial primary key,
  language_code   text not null references languages(code) on delete cascade,
  key             text not null,                    -- 'viewer.markDone', 'form.accountOpening.title'
  value           text not null,
  unique (language_code, key)
);

-- -------------------------------------------------------------------- users --
create table users (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  phone_e164      text not null unique,             -- +91XXXXXXXXXX
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint users_phone_india check (phone_e164 ~ '^\+91[6-9][0-9]{9}$'),
  constraint users_name_length check (char_length(btrim(name)) between 2 and 80)
);

-- OTP challenges for SMS sign-in. Only the hash of the code is stored.
create table otp_challenges (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references users(id) on delete cascade,
  code_hash           bytea not null,               -- HMAC of the code, never the code
  attempts            integer not null default 0,
  max_attempts        integer not null default 5,
  expires_at          timestamptz not null,
  consumed_at         timestamptz,
  resend_available_at timestamptz not null,
  created_at          timestamptz not null default now()
);
create index otp_challenges_user_idx on otp_challenges (user_id, created_at desc);

-- Server-side sessions. The token hash, never the token itself.
create table sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  token_hash      bytea not null unique,
  expires_at      timestamptz not null,
  revoked_at      timestamptz,
  last_seen_at    timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
create index sessions_user_idx on sessions (user_id) where revoked_at is null;

-- ------------------------------------------------------------------- banks --
create table banks (
  id              text primary key,                 -- 'sbi', 'hdfc'
  name            text not null,
  slug            text not null unique,
  emblem_asset_id text,                             -- Figma/asset registry key
  is_popular      boolean not null default false,
  is_active       boolean not null default true,
  sort            integer not null default 0
);

-- -------------------------------------------------------------- form types --
create table form_types (
  id               text primary key,                -- 'account-opening'
  title_key        text not null,                   -- ui_translations key
  description_key  text not null,
  icon_asset_id    text,
  is_active        boolean not null default true
);

-- --------------------------------------------------------------- bank forms --
-- A form type as offered by one bank ("SBI Account Opening Form").
create table bank_forms (
  id               text primary key,                -- 'sbi::account-opening'
  bank_id          text not null references banks(id) on delete cascade,
  form_type_id     text not null references form_types(id) on delete restrict,
  title_key        text not null,
  description_key  text not null,
  icon_asset_id    text,
  is_active        boolean not null default true,
  unique (bank_id, form_type_id)
);

-- ------------------------------------------------------------ form versions --
-- One published revision of paper artwork. Geometry and artwork are pinned here.
create table form_versions (
  id               text primary key,                -- 'sbi-aof-v1'
  bank_form_id     text not null references bank_forms(id) on delete cascade,
  version_label    text not null,                   -- printed revision, e.g. 'SBI-AOF-VER4-DEC2023'
  status           text not null default 'draft'    -- draft | published | retired
                     check (status in ('draft', 'published', 'retired')),
  -- sha256 of the artwork revision the coordinates were measured against.
  artwork_hash     text not null,
  source_note      text,                            -- where the artwork came from
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  unique (bank_form_id, version_label)
);
create index form_versions_published_idx on form_versions (bank_form_id, published_at desc)
  where status = 'published';

-- -------------------------------------------------------------- form pages --
create table form_pages (
  id               bigserial primary key,
  form_version_id  text not null references form_versions(id) on delete cascade,
  page_no          integer not null check (page_no >= 1),
  width            numeric(8, 2) not null check (width > 0),   -- intrinsic artwork units
  height           numeric(8, 2) not null check (height > 0),
  artwork_key      text not null,                   -- client artwork registry key
  is_peek          boolean not null default false,  -- rendered as a partial preview
  unique (form_version_id, page_no)
);

-- ------------------------------------------------------------- form fields --
-- Field geometry is expressed in the page's intrinsic coordinate space, so the
-- client can scale a page as one unit and never drift.
create table form_fields (
  id               uuid primary key default gen_random_uuid(),
  form_version_id  text not null references form_versions(id) on delete cascade,
  field_key        text not null,                   -- stable key, e.g. 'full-name'
  page_no          integer not null,
  x                numeric(8, 2) not null check (x >= 0),
  y                numeric(8, 2) not null check (y >= 0),
  width            numeric(8, 2) not null check (width > 0),
  height           numeric(8, 2) not null check (height > 0),
  label_key        text not null,                   -- ui_translations key
  is_required      boolean not null default true,   -- mandatory when applicable
  sort             integer not null default 0,
  unique (form_version_id, field_key),
  foreign key (form_version_id, page_no) references form_pages (form_version_id, page_no) on delete cascade
);
create index form_fields_version_idx on form_fields (form_version_id, page_no, sort);

-- ---------------------------------------------------------------- purposes --
create table purposes (
  id               text primary key,                -- 'sbi::account-opening::open-new'
  bank_form_id     text not null references bank_forms(id) on delete cascade,
  label_key        text not null,
  short_label_key  text not null,
  icon_asset_id    text,
  sort             integer not null default 0
);
create index purposes_bank_form_idx on purposes (bank_form_id, sort);

-- ------------------------------------------- purpose -> field applicability --
-- The single source of truth for highlighting. Reviewed by hand per purpose.
create table purpose_field_applicability (
  id               bigserial primary key,
  form_version_id  text not null references form_versions(id) on delete cascade,
  purpose_id       text not null references purposes(id) on delete cascade,
  field_id         uuid not null references form_fields(id) on delete cascade,
  is_applicable    boolean not null default true,
  reviewed_by      text,                            -- who signed off this mapping
  reviewed_at      timestamptz,
  unique (form_version_id, purpose_id, field_id)
);
create index applicability_lookup_idx on purpose_field_applicability (form_version_id, purpose_id)
  where is_applicable;

-- ----------------------------------------------------------- field guidance --
create table field_guidance (
  id               bigserial primary key,
  field_id         uuid not null references form_fields(id) on delete cascade,
  language_code    text not null references languages(code) on delete cascade,
  title            text not null,
  body             text not null,
  doc_label        text,                            -- e.g. 'Doc 1: Photo'
  unique (field_id, language_code)
);

-- ----------------------------------------------------------- saved forms ----
create table user_saved_forms (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  bank_form_id     text not null references bank_forms(id) on delete cascade,
  form_version_id  text not null references form_versions(id) on delete cascade,
  purpose_id       text not null references purposes(id) on delete cascade,
  status           text not null default 'in_progress'
                     check (status in ('in_progress', 'completed')),
  started_at       timestamptz not null default now(),
  last_viewed_at   timestamptz not null default now(),
  completed_at     timestamptz,
  unique (user_id, form_version_id, purpose_id)
);
create index saved_forms_recent_idx on user_saved_forms (user_id, last_viewed_at desc);

create table user_field_progress (
  id               bigserial primary key,
  saved_form_id    uuid not null references user_saved_forms(id) on delete cascade,
  field_id         uuid not null references form_fields(id) on delete cascade,
  state            text not null default 'pending'
                     check (state in ('pending', 'done')),
  updated_at       timestamptz not null default now(),
  unique (saved_form_id, field_id)
);

-- --------------------------------------------------------- user preferences --
create table user_preferences (
  user_id             uuid primary key references users(id) on delete cascade,
  language_code       text not null references languages(code),
  show_field_guidance boolean not null default true,
  updated_at          timestamptz not null default now()
);

-- =============================================================================
-- Published artwork/geometry is immutable.
-- =============================================================================

create or replace function forbid_published_version_edit() returns trigger as $$
begin
  if old.status = 'published' then
    raise exception 'form version % is published: publish a new version instead', old.id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger form_versions_immutable
  before update or delete on form_versions
  for each row execute function forbid_published_version_edit();

create or replace function forbid_published_child_edit() returns trigger as $$
declare
  version_id text := coalesce(new.form_version_id, old.form_version_id);
begin
  if exists (select 1 from form_versions where id = version_id and status = 'published') then
    raise exception 'form version % is published: its geometry is immutable', version_id;
  end if;
  return coalesce(new, old);
end;
$$ language plpgsql;

create trigger form_pages_immutable
  before update or delete on form_pages
  for each row execute function forbid_published_child_edit();

create trigger form_fields_immutable
  before update or delete on form_fields
  for each row execute function forbid_published_child_edit();

create trigger applicability_immutable
  before update or delete on purpose_field_applicability
  for each row execute function forbid_published_child_edit();

-- =============================================================================
-- Reporting helpers
-- =============================================================================

-- Progress for one saved form: highlighted vs. completed fields.
create view saved_form_progress as
select
  sf.id                                                        as saved_form_id,
  sf.user_id,
  sf.purpose_id,
  sf.form_version_id,
  count(a.field_id) filter (where f.is_required)               as required_fields,
  count(p.field_id) filter (where p.state = 'done')            as done_fields,
  bool_and(coalesce(p.state, 'pending') = 'done')              as is_complete
from user_saved_forms sf
join purpose_field_applicability a
  on a.form_version_id = sf.form_version_id
 and a.purpose_id = sf.purpose_id
 and a.is_applicable
join form_fields f on f.id = a.field_id
left join user_field_progress p
  on p.saved_form_id = sf.id
 and p.field_id = a.field_id
group by sf.id, sf.user_id, sf.purpose_id, sf.form_version_id;
