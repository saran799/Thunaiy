import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { LanguageCode } from '../domain/types';
import {
  appReducer,
  initialAppState,
  loadAppState,
  saveAppState,
  type AppState,
  type SessionState,
} from './appState';

export interface AppStateApi {
  state: AppState;
  isAuthenticated: boolean;
  signIn: (session: SessionState) => void;
  signOut: () => void;
  selectBank: (bankId: string) => void;
  selectBankForm: (bankFormId: string) => void;
  selectPurpose: (purposeId: string, formVersionId: string | null) => void;
  openSavedForm: (selections: {
    savedFormId: string;
    bankId: string;
    bankFormId: string;
    purposeId: string;
    formVersionId: string;
  }) => void;
  resetSelection: () => void;
  setLanguage: (languageCode: LanguageCode) => void;
  setShowFieldGuidance: (value: boolean) => void;
}

const AppStateContext = createContext<AppStateApi | null>(null);

interface AppStateProviderProps {
  children: ReactNode;
  /** Tests inject a fixed state and disable persistence. */
  initialState?: AppState;
  persist?: boolean;
}

export function AppStateProvider({ children, initialState, persist = true }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState ?? (persist ? loadAppState() : initialAppState));

  useEffect(() => {
    if (persist) saveAppState(state);
  }, [state, persist]);

  const signIn = useCallback((session: SessionState) => dispatch({ type: 'session/signedIn', payload: session }), []);
  const signOut = useCallback(() => dispatch({ type: 'session/signedOut' }), []);
  const selectBank = useCallback((bankId: string) => dispatch({ type: 'selection/bank', bankId }), []);
  const selectBankForm = useCallback((bankFormId: string) => dispatch({ type: 'selection/bankForm', bankFormId }), []);
  const selectPurpose = useCallback(
    (purposeId: string, formVersionId: string | null) => dispatch({ type: 'selection/purpose', purposeId, formVersionId }),
    [],
  );
  const openSavedForm = useCallback(
    (selections: {
      savedFormId: string;
      bankId: string;
      bankFormId: string;
      purposeId: string;
      formVersionId: string;
    }) => dispatch({ type: 'selection/openSavedForm', payload: selections }),
    [],
  );
  const resetSelection = useCallback(() => dispatch({ type: 'selection/reset' }), []);
  const setLanguage = useCallback(
    (languageCode: LanguageCode) => dispatch({ type: 'preferences/language', languageCode }),
    [],
  );
  const setShowFieldGuidance = useCallback(
    (value: boolean) => dispatch({ type: 'preferences/showFieldGuidance', value }),
    [],
  );

  const value = useMemo<AppStateApi>(
    () => ({
      state,
      isAuthenticated: state.session !== null,
      signIn,
      signOut,
      selectBank,
      selectBankForm,
      selectPurpose,
      openSavedForm,
      resetSelection,
      setLanguage,
      setShowFieldGuidance,
    }),
    [state, signIn, signOut, selectBank, selectBankForm, selectPurpose, openSavedForm, resetSelection, setLanguage, setShowFieldGuidance],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateApi {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside <AppStateProvider>.');
  return value;
}

/** Convenience hook for the pieces most screens need. */
export function useSession(): SessionState | null {
  return useAppState().state.session;
}

export function usePreferences() {
  return useAppState().state.preferences;
}

export function useSelections() {
  return useAppState().state.selections;
}
