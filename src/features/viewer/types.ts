/**
 * Data model for the form viewer.
 * Bank -> Form -> Version -> Purpose -> Pages -> Fields (coordinates) -> Applicable / Not applicable -> Overlay
 *
 * All coordinates are in the page's own intrinsic pixel space (page.width x page.height),
 * measured from the top-left corner. The page is scaled as one unit, so the overlay can never drift.
 */
export interface FormFieldRect {
  id: string;
  /** 1-based page number the field lives on. */
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Whether the field is highlighted for the currently selected purpose. */
  applicable: boolean;
  required: boolean;
  label: string;
}

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

export interface FormDocument {
  bank: string;
  form: string;
  version: string;
  /** Short label used in the guidance bar, e.g. "New Account". */
  purposeLabel: string;
  pages: FormPageSpec[];
  fields: FormFieldRect[];
}
