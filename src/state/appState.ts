import { DEFAULT_LANGUAGE, isLanguageCode } from '../domain/languages';
import type { LanguageCode, User } from '../domain/types';

/**
 * Application state: session, the onboarding flow selections and user
 * preferences. It is deliberately small — a reducer plus one persistence key —
 * so that the flow survives navigation and reloads without pulling in a state
 * library.
 */

export interface SessionState {
  token: string;
  expiresAt: string;
  user: User;
}

export interface SelectionsState {
  bankId: string | null;
  bankFormId: string | null;
  purposeId: string | null;
  formVersionId: string | null;
  savedFormId: string | null;
}

export interface PreferencesState {
  languageCode: LanguageCode;
  showFieldGuidance: boolean;
}

export interface AppState {
  session: SessionState | null;
  selections: SelectionsState;
  preferences: PreferencesState;
}

export const EMPTY_SELECTIONS: SelectionsState = {
  bankId: null,
  bankFormId: null,
  purposeId: null,
  formVersionId: null,
  savedFormId: null,
};

export const initialAppState: AppState = {
  session: null,
  selections: EMPTY_SELECTIONS,
  preferences: { languageCode: DEFAULT_LANGUAGE, showFieldGuidance: true },
};

export type AppAction =
  | { type: 'session/restored'; payload: SessionState }
  | { type: 'session/signedIn'; payload: SessionState }
  | { type: 'session/signedOut' }
  | { type: 'selection/bank'; bankId: string }
  | { type: 'selection/bankForm'; bankFormId: string }
  | { type: 'selection/purpose'; purposeId: string; formVersionId: string | null }
  | {
      type: 'selection/openSavedForm';
      payload: { savedFormId: string; bankId: string; bankFormId: string; purposeId: string; formVersionId: string };
    }
  | { type: 'selection/reset' }
  | { type: 'preferences/language'; languageCode: LanguageCode }
  | { type: 'preferences/showFieldGuidance'; value: boolean };

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'session/restored':
    case 'session/signedIn':
      return { ...state, session: action.payload };
    case 'session/signedOut':
      // Signing out clears the in-flight flow selections; preferences (language,
      // guidance) stay on the device for the next sign-in.
      return { ...state, session: null, selections: EMPTY_SELECTIONS };
    case 'selection/bank':
      return {
        ...state,
        selections: { ...EMPTY_SELECTIONS, bankId: action.bankId },
      };
    case 'selection/bankForm':
      return {
        ...state,
        selections: { ...state.selections, bankFormId: action.bankFormId, purposeId: null, formVersionId: null, savedFormId: null },
      };
    case 'selection/purpose':
      return {
        ...state,
        selections: {
          ...state.selections,
          purposeId: action.purposeId,
          formVersionId: action.formVersionId,
          savedFormId: null,
        },
      };
    case 'selection/openSavedForm':
      return { ...state, selections: { ...action.payload } };
    case 'selection/reset':
      return { ...state, selections: EMPTY_SELECTIONS };
    case 'preferences/language':
      return { ...state, preferences: { ...state.preferences, languageCode: action.languageCode } };
    case 'preferences/showFieldGuidance':
      return { ...state, preferences: { ...state.preferences, showFieldGuidance: action.value } };
    default:
      return state;
  }
}

/** True once bank, form, purpose and version are all known. */
export function hasCompleteSelection(selections: SelectionsState): boolean {
  return Boolean(
    selections.bankId && selections.bankFormId && selections.purposeId && selections.formVersionId,
  );
}

/* ------------------------------------------------------------- persistence -- */

export const APP_STATE_STORAGE_KEY = 'thunaiy.app.v1';

function isUser(value: unknown): value is User {
  const candidate = value as Partial<User> | null;
  return Boolean(
    candidate &&
      typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.phoneE164 === 'string',
  );
}

function parseSession(value: unknown): SessionState | null {
  const candidate = value as Partial<SessionState> | null;
  if (
    !candidate ||
    typeof candidate.token !== 'string' ||
    typeof candidate.expiresAt !== 'string' ||
    !isUser(candidate.user)
  ) {
    return null;
  }
  if (Date.parse(candidate.expiresAt) <= Date.now()) return null;
  return { token: candidate.token, expiresAt: candidate.expiresAt, user: candidate.user as User };
}

function parseSelections(value: unknown): SelectionsState {
  const candidate = (value ?? {}) as Partial<SelectionsState>;
  const readId = (input: unknown) => (typeof input === 'string' && input.length > 0 ? input : null);
  return {
    bankId: readId(candidate.bankId),
    bankFormId: readId(candidate.bankFormId),
    purposeId: readId(candidate.purposeId),
    formVersionId: readId(candidate.formVersionId),
    savedFormId: readId(candidate.savedFormId),
  };
}

function parsePreferences(value: unknown): PreferencesState {
  const candidate = (value ?? {}) as Partial<PreferencesState>;
  return {
    languageCode: isLanguageCode(candidate.languageCode) ? candidate.languageCode : DEFAULT_LANGUAGE,
    showFieldGuidance: candidate.showFieldGuidance !== false,
  };
}

/** Reads persisted state defensively — anything unrecognised falls back to defaults. */
export function parseAppState(value: unknown): AppState {
  const candidate = (value ?? {}) as Partial<AppState>;
  return {
    session: parseSession(candidate.session),
    selections: parseSelections(candidate.selections),
    preferences: parsePreferences(candidate.preferences),
  };
}

export function loadAppState(storage: Storage | undefined = globalThis.localStorage): AppState {
  if (!storage) return initialAppState;
  try {
    const raw = storage.getItem(APP_STATE_STORAGE_KEY);
    if (!raw) return initialAppState;
    return parseAppState(JSON.parse(raw));
  } catch {
    return initialAppState;
  }
}

export function saveAppState(state: AppState, storage: Storage | undefined = globalThis.localStorage): void {
  if (!storage) return;
  try {
    storage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — state simply does not survive a reload */
  }
}

export function clearAppState(storage: Storage | undefined = globalThis.localStorage): void {
  try {
    storage?.removeItem(APP_STATE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
