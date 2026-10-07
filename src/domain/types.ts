import type { FigmaAssetId } from '../assets/figmaAssets';

/**
 * Domain model for Thunaiy.
 *
 * These entities are the contract between the UI and the service layer. They
 * mirror the SQL schema in `db/schema.sql` one-to-one so that the in-browser
 * development backend (`src/services/mock`) and a real HTTP backend return
 * exactly the same shapes.
 *
 * Rules that must not be broken:
 *  - form geometry belongs to a specific form *version*; published versions are
 *    immutable (a new revision gets a new row, never an update);
 *  - UI copy is never stored in these entities, only i18n keys, so that the
 *    same row can be rendered in every supported language.
 */

export type LanguageCode = 'en' | 'ta' | 'hi' | 'te' | 'kn';

export interface LanguageOption {
  id: LanguageCode;
  /** Endonym shown on the language screen (never translated). */
  label: string;
  englishLabel: string;
  /** Tailwind font-family utility used while this language is active. */
  fontClass: string;
}

export interface User {
  id: string;
  name: string;
  /** E.164, e.g. +919876543210 */
  phoneE164: string;
  createdAt: string;
}

export interface Bank {
  id: string;
  name: string;
  slug: string;
  /** Null while no emblem has been exported for this bank (see assets task). */
  emblem: FigmaAssetId | null;
  /** Shown in the "popular banks" grid; the rest appear behind "View all banks". */
  popular: boolean;
  isActive: boolean;
}

/** Global form catalogue entry, e.g. "Account Opening Form". */
export interface FormType {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: FigmaAssetId;
}

/** A (bank, form type) pair — the unit the user actually selects. */
export interface BankForm {
  id: string;
  bankId: string;
  formTypeId: string;
  isActive: boolean;
}

export type FormVersionStatus = 'published' | 'draft';

export interface FormVersion {
  id: string;
  bankFormId: string;
  /** Printed revision of the physical form, e.g. SBI-AOF-VER4-DEC2023. */
  versionLabel: string;
  /** Hash of the artwork files this geometry was measured against. */
  artworkHash: string;
  status: FormVersionStatus;
  publishedAt: string;
}

export interface Purpose {
  id: string;
  bankFormId: string;
  labelKey: string;
  /** Short label used in the viewer guidance bar, e.g. "New Account". */
  shortLabelKey: string;
  icon: FigmaAssetId;
  sort: number;
}

/** purpose_field_applicability — one row per (version, purpose, field). */
export interface PurposeApplicability {
  formVersionId: string;
  purposeId: string;
  fieldId: string;
  applicable: boolean;
}

/** field_guidance — localised guidance copy for one field. */
export interface FieldGuidance {
  fieldId: string;
  languageCode: LanguageCode;
  title: string;
  body: string;
  /** Optional supporting document chip, e.g. "Doc 1: Photo". */
  docLabel?: string;
}

export type SavedFormStatus = 'in_progress' | 'completed';

export interface SavedForm {
  id: string;
  userId: string;
  bankId: string;
  bankFormId: string;
  formVersionId: string;
  purposeId: string;
  status: SavedFormStatus;
  startedAt: string;
  lastViewedAt: string;
  completedAt: string | null;
}

/** Saved form joined with everything the Home / Forms screens need to render. */
export interface SavedFormSummary extends SavedForm {
  bankName: string;
  formTitleKey: string;
  descriptionKey: string;
  purposeLabelKey: string;
  purposeShortLabelKey: string;
  versionLabel: string;
  icon: FigmaAssetId;
  /** Progress across the fields this purpose actually highlights. */
  requiredFields: number;
  doneFields: number;
}

export type FieldProgressState = 'pending' | 'done';

export interface FieldProgress {
  savedFormId: string;
  fieldId: string;
  state: FieldProgressState;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  languageCode: LanguageCode;
  showFieldGuidance: boolean;
  updatedAt: string;
}

/** A row of the Forms directory: a bank form plus its bank. */
export interface DirectoryFormItem {
  bankFormId: string;
  bankId: string;
  bankName: string;
  formTypeId: string;
  titleKey: string;
  descriptionKey: string;
  icon: FigmaAssetId;
  /** i18n keys of the purposes offered for this form (used by directory search). */
  purposeLabelKeys: string[];
  /** False when no published version of this form carries artwork/geometry yet. */
  available: boolean;
}

/** A row of the "Select your form" screen. */
export interface BankFormListItem {
  bankFormId: string;
  formTypeId: string;
  titleKey: string;
  descriptionKey: string;
  icon: FigmaAssetId;
  available: boolean;
}

export interface Session {
  token: string;
  expiresAt: string;
  user: User;
}

export type OtpChallengeStatus = 'pending' | 'verified' | 'expired' | 'locked';
