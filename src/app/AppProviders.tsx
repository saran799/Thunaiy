import { useEffect, useState, type ReactNode } from 'react';
import { I18nProvider } from '../i18n/I18nProvider';
import { ServicesProvider } from '../services/ServicesProvider';
import type { Services } from '../services/types';
import { AppStateProvider, useAppState } from '../state/AppStateContext';
import type { AppState } from '../state/appState';
import Screen from '../components/Screen';
import StatePanel from '../components/states/StatePanel';
import { useServices } from '../services/ServicesProvider';
import { useTranslation } from '../i18n/I18nProvider';

/** Feeds the persisted language into the i18n runtime. */
function I18nGate({ children }: { children: ReactNode }) {
  const { state } = useAppState();
  return <I18nProvider languageCode={state.preferences.languageCode}>{children}</I18nProvider>;
}

/**
 * Validates a persisted session token on start-up. A token that the backend no
 * longer accepts (expired, revoked by logout elsewhere) is dropped before any
 * protected screen renders.
 */
function SessionGate({ children }: { children: ReactNode }) {
  const { state, signIn, signOut } = useAppState();
  const services = useServices();
  const { t } = useTranslation();
  const [checked, setChecked] = useState(state.session === null);

  useEffect(() => {
    const session = state.session;
    if (!session) {
      setChecked(true);
      return;
    }
    let cancelled = false;
    services.auth
      .restoreSession(session.token)
      .then((restored) => {
        if (!cancelled) signIn(restored);
      })
      .catch(() => {
        if (!cancelled) signOut();
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });
    return () => {
      cancelled = true;
    };
    // Runs once per stored token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) {
    return (
      <Screen>
        <StatePanel variant="loading" title={t('common.loading')} />
      </Screen>
    );
  }
  return <>{children}</>;
}

interface Props {
  children: ReactNode;
  /** Tests inject isolated services / state. */
  services?: Services;
  initialState?: AppState;
  persist?: boolean;
}

export default function AppProviders({ children, services, initialState, persist = true }: Props) {
  return (
    <ServicesProvider value={services}>
      <AppStateProvider initialState={initialState} persist={persist}>
        <I18nGate>
          <SessionGate>{children}</SessionGate>
        </I18nGate>
      </AppStateProvider>
    </ServicesProvider>
  );
}
