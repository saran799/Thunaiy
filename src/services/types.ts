import type {
  Bank,
  BankForm,
  BankFormListItem,
  DirectoryFormItem,
  FieldGuidance,
  FieldProgress,
  FieldProgressState,
  FormType,
  FormVersion,
  LanguageCode,
  LanguageOption,
  Purpose,
  SavedForm,
  SavedFormSummary,
  Session,
  User,
  UserPreferences,
} from '../domain/types';
import type { FormBundle } from '../features/viewer/types';

/**
 * Service contracts. The UI only ever talks to these interfaces, so the
 * in-browser development backend can be swapped for the HTTP backend by
 * changing VITE_AUTH_MODE/VITE_API_BASE_URL — no page or component changes.
 */

export interface OtpChallenge {
  challengeId: string;
  /** When the code stops being accepted. */
  expiresAt: string;
  /** When a new code may be requested. */
  resendAvailableAt: string;
  /**
   * Only present when the development backend is active. A real backend never
   * returns the code; the development backend surfaces it so the flow can be
   * exercised without an SMS provider (see docs in README).
   */
  devCode?: string;
}

export interface AuthService {
  /** Identifies the implementation so the UI can label development-only affordances. */
  readonly kind: 'dev' | 'api';
  requestOtp(input: { name: string; phoneE164: string }): Promise<OtpChallenge>;
  resendOtp(input: { challengeId: string }): Promise<OtpChallenge>;
  verifyOtp(input: { challengeId: string; code: string }): Promise<Session>;
  /** Validates a stored token on app start; rejects with `unauthorized`. */
  restoreSession(token: string): Promise<Session>;
  logout(token: string): Promise<void>;
}

/** Bank + form + form type, resolved together for the flow screens. */
export interface BankFormDetail {
  bank: Bank;
  bankForm: BankForm;
  formType: FormType;
}

export interface CatalogService {
  listLanguages(): Promise<LanguageOption[]>;
  listBanks(): Promise<Bank[]>;
  getBank(bankId: string): Promise<Bank | null>;
  listBankForms(bankId: string): Promise<BankFormListItem[]>;
  listDirectoryForms(): Promise<DirectoryFormItem[]>;
  getBankForm(bankFormId: string): Promise<BankForm | null>;
  getBankFormDetail(bankFormId: string): Promise<BankFormDetail | null>;
  listPurposes(bankFormId: string): Promise<Purpose[]>;
  getPurpose(purposeId: string): Promise<Purpose | null>;
  /**
   * Resolves the published version that should be used for a bank form; when a
   * purpose is supplied, only versions that declare applicability for it match.
   */
  resolveVersion(bankFormId: string, purposeId: string): Promise<FormVersion | null>;
  getVersion(versionId: string): Promise<FormVersion | null>;
}

export interface FormService {
  /**
   * Everything the viewer needs for one (version, purpose) pair: page geometry,
   * field geometry, purpose applicability and localised field guidance.
   * Returns null when the version is unknown or has no published artwork.
   */
  getFormBundle(input: { versionId: string; purposeId: string; languageCode: LanguageCode }): Promise<FormBundle | null>;
  getFieldGuidance(fieldId: string, languageCode: LanguageCode): Promise<FieldGuidance | null>;
}

export interface SavedFormService {
  /** Creates the saved form for this (user, version, purpose) or resumes it. */
  startOrResume(input: {
    token: string;
    bankId: string;
    bankFormId: string;
    formVersionId: string;
    purposeId: string;
  }): Promise<SavedForm>;
  get(token: string, savedFormId: string): Promise<SavedForm | null>;
  /** Saved form joined with the catalogue data the Home/Complete screens render. */
  getSummary(token: string, savedFormId: string): Promise<SavedFormSummary | null>;
  listSummaries(token: string, limit?: number): Promise<SavedFormSummary[]>;
  setFieldProgress(input: {
    token: string;
    savedFormId: string;
    fieldId: string;
    state: FieldProgressState;
  }): Promise<FieldProgress[]>;
  listFieldProgress(token: string, savedFormId: string): Promise<FieldProgress[]>;
  /** Restores a saved form's context (bank, form, purpose, version). */
  restore(token: string, savedFormId: string): Promise<SavedForm | null>;
  complete(token: string, savedFormId: string): Promise<SavedForm>;
}

export interface PreferenceService {
  get(token: string): Promise<UserPreferences>;
  update(token: string, patch: Partial<Pick<UserPreferences, 'languageCode' | 'showFieldGuidance'>>): Promise<UserPreferences>;
  /** Called right after registration so a new account starts with its choices. */
  ensureForUser(token: string, defaults: Partial<UserPreferences>): Promise<UserPreferences>;
}

export interface Services {
  backend: 'dev' | 'http';
  auth: AuthService;
  catalog: CatalogService;
  forms: FormService;
  savedForms: SavedFormService;
  preferences: PreferenceService;
}

export type { User };
