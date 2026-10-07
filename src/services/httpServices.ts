import type {
  Bank,
  BankForm,
  BankFormListItem,
  DirectoryFormItem,
  FieldProgress,
  FieldProgressState,
  FormVersion,
  LanguageOption,
  Purpose,
  SavedForm,
  SavedFormSummary,
  Session,
  UserPreferences,
} from '../domain/types';
import type { FormBundle } from '../features/viewer/types';
import { apiRequest } from './apiClient';
import type {
  AuthService,
  BankFormDetail,
  CatalogService,
  FormService,
  OtpChallenge,
  PreferenceService,
  SavedFormService,
  Services,
} from './types';

/**
 * HTTP implementation of every service contract.
 *
 * Enabled with VITE_AUTH_MODE=api + VITE_API_BASE_URL. It is written against
 * the REST surface described in db/README.md; the development backend
 * (src/services/mock) returns exactly the same payload shapes, so no UI code
 * changes when the real backend is switched on.
 *
 * Authentication note: the access token is sent as a bearer token and is kept
 * in memory + local storage for the MVP. A production backend should also set
 * an httpOnly, Secure, SameSite refresh cookie and rotate tokens — that is a
 * server-side change and does not affect this client contract.
 */

class HttpAuthService implements AuthService {
  readonly kind = 'api' as const;

  requestOtp(input: { name: string; phoneE164: string }): Promise<OtpChallenge> {
    return apiRequest<OtpChallenge>('/auth/otp/request', { method: 'POST', body: input });
  }

  resendOtp(input: { challengeId: string }): Promise<OtpChallenge> {
    return apiRequest<OtpChallenge>('/auth/otp/resend', { method: 'POST', body: input });
  }

  verifyOtp(input: { challengeId: string; code: string }): Promise<Session> {
    return apiRequest<Session>('/auth/otp/verify', { method: 'POST', body: input });
  }

  restoreSession(token: string): Promise<Session> {
    return apiRequest<Session>('/auth/session', { token });
  }

  logout(token: string): Promise<void> {
    return apiRequest<void>('/auth/session', { method: 'DELETE', token });
  }
}

class HttpCatalogService implements CatalogService {
  listLanguages(): Promise<LanguageOption[]> {
    return apiRequest<LanguageOption[]>('/catalogue/languages');
  }
  listBanks(): Promise<Bank[]> {
    return apiRequest<Bank[]>('/catalogue/banks');
  }
  getBank(bankId: string): Promise<Bank | null> {
    return apiRequest<Bank | null>(`/catalogue/banks/${encodeURIComponent(bankId)}`);
  }
  listBankForms(bankId: string): Promise<BankFormListItem[]> {
    return apiRequest<BankFormListItem[]>(`/catalogue/banks/${encodeURIComponent(bankId)}/forms`);
  }
  listDirectoryForms(): Promise<DirectoryFormItem[]> {
    return apiRequest<DirectoryFormItem[]>('/catalogue/forms');
  }
  getBankForm(bankFormId: string): Promise<BankForm | null> {
    return apiRequest<BankForm | null>(`/catalogue/bank-forms/${encodeURIComponent(bankFormId)}`);
  }
  getBankFormDetail(bankFormId: string): Promise<BankFormDetail | null> {
    return apiRequest<BankFormDetail | null>(`/catalogue/bank-forms/${encodeURIComponent(bankFormId)}/detail`);
  }
  listPurposes(bankFormId: string): Promise<Purpose[]> {
    return apiRequest<Purpose[]>(`/catalogue/bank-forms/${encodeURIComponent(bankFormId)}/purposes`);
  }
  getPurpose(purposeId: string): Promise<Purpose | null> {
    return apiRequest<Purpose | null>(`/catalogue/purposes/${encodeURIComponent(purposeId)}`);
  }
  resolveVersion(bankFormId: string, purposeId: string): Promise<FormVersion | null> {
    const query = new URLSearchParams({ bankFormId, purposeId }).toString();
    return apiRequest<FormVersion | null>(`/catalogue/resolve-version?${query}`);
  }
  getVersion(versionId: string): Promise<FormVersion | null> {
    return apiRequest<FormVersion | null>(`/catalogue/form-versions/${encodeURIComponent(versionId)}`);
  }
}

class HttpFormService implements FormService {
  getFormBundle(input: { versionId: string; purposeId: string; languageCode: string }): Promise<FormBundle | null> {
    const query = new URLSearchParams({
      purposeId: input.purposeId,
      languageCode: input.languageCode,
    }).toString();
    return apiRequest<FormBundle | null>(`/forms/${encodeURIComponent(input.versionId)}?${query}`);
  }

  async getFieldGuidance(fieldId: string, languageCode: string) {
    const query = new URLSearchParams({ languageCode }).toString();
    return apiRequest<FormBundle['guidance'][number] | null>(`/forms/fields/${encodeURIComponent(fieldId)}/guidance?${query}`);
  }
}

class HttpSavedFormService implements SavedFormService {
  startOrResume(input: {
    token: string;
    bankId: string;
    bankFormId: string;
    formVersionId: string;
    purposeId: string;
  }): Promise<SavedForm> {
    const { token, ...body } = input;
    return apiRequest<SavedForm>('/saved-forms', { method: 'POST', body, token });
  }
  get(token: string, savedFormId: string): Promise<SavedForm | null> {
    return apiRequest<SavedForm | null>(`/saved-forms/${encodeURIComponent(savedFormId)}`, { token });
  }
  getSummary(token: string, savedFormId: string): Promise<SavedFormSummary | null> {
    return apiRequest<SavedFormSummary | null>(`/saved-forms/${encodeURIComponent(savedFormId)}/summary`, { token });
  }
  listSummaries(token: string, limit = 20): Promise<SavedFormSummary[]> {
    return apiRequest<SavedFormSummary[]>(`/saved-forms?limit=${limit}`, { token });
  }
  setFieldProgress(input: {
    token: string;
    savedFormId: string;
    fieldId: string;
    state: FieldProgressState;
  }): Promise<FieldProgress[]> {
    const { token, savedFormId, ...body } = input;
    return apiRequest<FieldProgress[]>(`/saved-forms/${encodeURIComponent(savedFormId)}/field-progress`, {
      method: 'PATCH',
      body,
      token,
    });
  }
  listFieldProgress(token: string, savedFormId: string): Promise<FieldProgress[]> {
    return apiRequest<FieldProgress[]>(`/saved-forms/${encodeURIComponent(savedFormId)}/field-progress`, { token });
  }
  restore(token: string, savedFormId: string): Promise<SavedForm | null> {
    return apiRequest<SavedForm | null>(`/saved-forms/${encodeURIComponent(savedFormId)}/restore`, {
      method: 'POST',
      token,
    });
  }
  complete(token: string, savedFormId: string): Promise<SavedForm> {
    return apiRequest<SavedForm>(`/saved-forms/${encodeURIComponent(savedFormId)}/complete`, {
      method: 'POST',
      token,
    });
  }
}

class HttpPreferenceService implements PreferenceService {
  get(token: string): Promise<UserPreferences> {
    return apiRequest<UserPreferences>('/me/preferences', { token });
  }
  update(
    token: string,
    patch: Partial<Pick<UserPreferences, 'languageCode' | 'showFieldGuidance'>>,
  ): Promise<UserPreferences> {
    return apiRequest<UserPreferences>('/me/preferences', { method: 'PATCH', body: patch, token });
  }
  ensureForUser(token: string, defaults: Partial<UserPreferences>): Promise<UserPreferences> {
    return apiRequest<UserPreferences>('/me/preferences', { method: 'PATCH', body: defaults, token });
  }
}

export function createHttpServices(): Services {
  return {
    backend: 'http',
    auth: new HttpAuthService(),
    catalog: new HttpCatalogService(),
    forms: new HttpFormService(),
    savedForms: new HttpSavedFormService(),
    preferences: new HttpPreferenceService(),
  };
}
