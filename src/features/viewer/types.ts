import type {
  FieldGuidance,
  FieldProgressState,
  FormVersion,
  LanguageCode,
} from '../../domain/types';

/**
 * Data model for the form viewer.
 *
 * Bank -> Form -> Version -> Purpose -> Pages -> Fields (coordinates) -> Applicability -> Overlay
 *
 * All coordinates are in the page's own intrinsic pixel space (page.width x page.height),
 * measured from the top-left corner. The page is scaled as one unit, so the overlay can never drift.
 *
 * Applicability is *not* a property of a field. It is a property of the
 * (form version, purpose, field) triple — see `PurposeApplicability` in
 * src/domain/types.ts and `FormBundle.applicability` below. When a document is
 * resolved for a purpose, each field receives a computed `applicable` flag so
 * the rendering layer stays simple; the source of truth is always the
 * applicability map owned by the form version.
 */

/** One `form_fields` row: geometry in the page's intrinsic pixel space. */
export interface FormFieldDefinition {
  id: string;
  formVersionId: string;
  /** 1-based page number the field lives on. */
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Stable key used for guidance lookups, e.g. "account-type". */
  fieldKey: string;
  /** i18n key of the field label. */
  labelKey: string;
  /** Whether the field is mandatory when it applies to a purpose. */
  required: boolean;
  sort: number;
}

/** One `form_pages` row plus the presentational sheet treatment for that page. */
export interface FormPageSpec {
  page: number;
  /** Intrinsic size in px (Figma frame size). */
  width: number;
  height: number;
  /** Key into the artwork registry (the drawn form content for this page). */
  artwork: string;
  /** Tailwind classes for the sheet surface (background, radius, shadow, opacity). */
  sheetClass: string;
  /** True for the faded preview of a following page. */
  peek?: boolean;
}

/** Raw payload returned by the form service for one (version, purpose) pair. */
export interface FormBundle {
  version: FormVersion;
  pages: FormPageSpec[];
  fields: FormFieldDefinition[];
  /**
   * purposeId -> applicable field ids, for this form version only.
   * Mirrors `purpose_field_applicability`.
   */
  applicability: Record<string, string[]>;
  guidance: FieldGuidance[];
}

/** A field resolved for one purpose, ready to render. */
export interface FormFieldRect {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Computed from FormBundle.applicability for the active purpose. */
  applicable: boolean;
  required: boolean;
  /** Localised label (already translated). */
  label: string;
  fieldKey: string;
  guidance: FieldGuidance | null;
  progress: FieldProgressState;
}

/**
 * View-model rendered by FormViewer. Produced by `resolveFormDocument`
 * (src/features/viewer/resolve.ts) from a FormBundle + purpose + language +
 * saved-form progress.
 */
export interface FormDocument {
  bankId: string;
  bankName: string;
  bankFormId: string;
  formTypeId: string;
  formTitleKey: string;
  versionId: string;
  versionLabel: string;
  artworkHash: string;
  purposeId: string;
  purposeLabelKey: string;
  purposeShortLabelKey: string;
  languageCode: LanguageCode;
  pages: FormPageSpec[];
  fields: FormFieldRect[];
  /** Fields highlighted for the active purpose that are also mandatory. */
  requiredCount: number;
  doneCount: number;
}
