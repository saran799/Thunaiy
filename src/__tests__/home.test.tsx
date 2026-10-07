import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';
import AppProviders from '../app/AppProviders';
import { initialAppState, type AppState } from '../state/appState';
import { createTestServices, TEST_NAME } from '../test/fixtures';
import { SBI_AOF_VERSION_ID, SBI_ACCOUNT_OPENING_BANK_FORM_ID } from '../services/mock/seed';

const PURPOSE_OPEN_NEW = `${SBI_ACCOUNT_OPENING_BANK_FORM_ID}::open-new`;

async function signedInState(options: { withSavedForm?: boolean; completed?: boolean } = {}) {
  const { services } = createTestServices();
  const challenge = await services.auth.requestOtp({ name: TEST_NAME, phoneE164: '+919876543210' });
  const session = await services.auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });

  const state: AppState = {
    ...initialAppState,
    session: { token: session.token, user: session.user, expiresAt: session.expiresAt },
  };

  if (options.withSavedForm !== false) {
    const saved = await services.savedForms.startOrResume({
      token: session.token,
      bankId: 'sbi',
      bankFormId: SBI_ACCOUNT_OPENING_BANK_FORM_ID,
      formVersionId: SBI_AOF_VERSION_ID,
      purposeId: PURPOSE_OPEN_NEW,
    });
    if (options.completed) await services.savedForms.complete(session.token, saved.id);
  }

  return { services, state };
}

function renderAt(path: string, state: AppState, services: ReturnType<typeof createTestServices>['services']) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders services={services} initialState={state} persist={false}>
        <App />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe('home screen', () => {
  it('lists saved forms and shows their status', async () => {
    const { services, state } = await signedInState({ completed: true });
    renderAt('/home', state, services);

    expect(await screen.findByText('Recent forms')).toBeTruthy();
    expect(await screen.findByText('Account Opening Form')).toBeTruthy();
    expect(await screen.findByText('State Bank of India')).toBeTruthy();
    expect(await screen.findByText('Guidance completed')).toBeTruthy();
    expect(screen.queryByText('Your recent forms will appear here.')).toBeNull();
  });

  it('continues a saved form with its stored context', async () => {
    const { services, state } = await signedInState();
    renderAt('/home', state, services);

    fireEvent.click(await screen.findByLabelText('Open Account Opening Form for State Bank of India'));

    // The viewer opens on the stored bank/form/purpose rather than starting over.
    expect(await screen.findByText('Account Opening Form Page 1')).toBeTruthy();
    expect(await screen.findByText('6 required fields')).toBeTruthy();
    expect(document.querySelector('main p')?.textContent).toContain('for New Account');
  });

  it('shows the empty state when there are no saved forms', async () => {
    const { services, state } = await signedInState({ withSavedForm: false });
    renderAt('/home', state, services);

    expect(await screen.findByText('Your recent forms will appear here.')).toBeTruthy();
    expect(screen.queryByText('Recent forms')).toBeNull();
  });
});
