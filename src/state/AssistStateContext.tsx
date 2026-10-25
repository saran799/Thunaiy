import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { DEFAULT_LANGUAGE } from '../domain/languages';
import type { LanguageCode } from '../domain/types';
import { EMPTY_SELECTIONS, type SelectionsState } from './appState';

interface AssistState {
  selections: SelectionsState;
  languageCode: LanguageCode;
  branchId: string | null;
}

const initialState: AssistState = {
  selections: EMPTY_SELECTIONS,
  languageCode: DEFAULT_LANGUAGE,
  branchId: null,
};

type AssistAction =
  | { type: 'set/branch'; branchId: string }
  | { type: 'set/language'; languageCode: LanguageCode }
  | { type: 'selection/bank'; bankId: string }
  | { type: 'selection/bankForm'; bankFormId: string }
  | { type: 'selection/purpose'; purposeId: string; formVersionId: string | null }
  | { type: 'reset' };

function assistReducer(state: AssistState, action: AssistAction): AssistState {
  switch (action.type) {
    case 'set/branch':
      return { ...state, branchId: action.branchId };
    case 'set/language':
      return { ...state, languageCode: action.languageCode };
    case 'selection/bank':
      return { ...state, selections: { ...EMPTY_SELECTIONS, bankId: action.bankId } };
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
    case 'reset':
      return { ...state, selections: EMPTY_SELECTIONS, branchId: null };
    default:
      return state;
  }
}

interface AssistContextValue {
  state: AssistState;
  setBranch: (branchId: string) => void;
  setLanguage: (code: LanguageCode) => void;
  selectBank: (bankId: string) => void;
  selectBankForm: (bankFormId: string) => void;
  selectPurpose: (purposeId: string, formVersionId: string | null) => void;
  reset: () => void;
}

const AssistContext = createContext<AssistContextValue | null>(null);

export function AssistStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(assistReducer, initialState);

  const value: AssistContextValue = {
    state,
    setBranch: (branchId) => dispatch({ type: 'set/branch', branchId }),
    setLanguage: (languageCode) => dispatch({ type: 'set/language', languageCode }),
    selectBank: (bankId) => dispatch({ type: 'selection/bank', bankId }),
    selectBankForm: (bankFormId) => dispatch({ type: 'selection/bankForm', bankFormId }),
    selectPurpose: (purposeId, formVersionId) => dispatch({ type: 'selection/purpose', purposeId, formVersionId }),
    reset: () => dispatch({ type: 'reset' }),
  };

  return <AssistContext.Provider value={value}>{children}</AssistContext.Provider>;
}

export function useAssistState(): AssistContextValue {
  const context = useContext(AssistContext);
  if (!context) throw new Error('useAssistState must be used within an AssistStateProvider');
  return context;
}
