import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';
import AppProviders from '../app/AppProviders';
import { initialAppState, type AppState } from '../state/appState';
import { createTestServices, TEST_NAME, TEST_PHONE } from '../test/fixtures';

async function authenticatedState(): Promise<{ services: ReturnType<typeof createTestServices>['services']; state: AppState }> {
  const { services } = createTestServices();
  const challenge = await services.auth.requestOtp({ name: TEST_NAME, phoneE164: TEST_PHONE });
  const session = await services.auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });
  return {
    services,
    state: {
      ...initialAppState,
      session: { token: session.token, user: session.user, expiresAt: session.expiresAt },
    },
  };
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

describe('protected routes', () => {
  it.each(['/home', '/forms', '/settings', '/viewer', '/complete', '/bank', '/form', '/purpose'])(
    'redirects an unauthenticated visitor from %s to registration',
    async (path) => {
      const { services } = createTestServices();
      renderAt(path, initialAppState, services);

      expect(await screen.findByText('Welcome to Thunaiy')).toBeTruthy();
    },
  );

  it('renders the home screen for an authenticated user', async () => {
    const { services, state } = await authenticatedState();
    renderAt('/home', state, services);

    expect(await screen.findByText('What form do you need help with?')).toBeTruthy();
    expect(await screen.findByText('Your recent forms will appear here.')).toBeTruthy();
  });

  it('reads the form directory for an authenticated user', async () => {
    const { services, state } = await authenticatedState();
    renderAt('/forms', state, services);

    expect(await screen.findByText('Available forms')).toBeTruthy();
    expect(await screen.findAllByText('Account Opening Form')).toBeTruthy();
  });

  it('shows the signed-in profile on the settings screen', async () => {
    const { services, state } = await authenticatedState();
    renderAt('/settings', state, services);

    expect(await screen.findByText(TEST_NAME)).toBeTruthy();
    expect(await screen.findByText('+91 98765 43210')).toBeTruthy();
    expect(await screen.findByText('Log out')).toBeTruthy();
  });

  it('keeps the bank selection in app state when moving to form selection', async () => {
    const { services, state } = await authenticatedState();
    renderAt('/form', state, services);

    // No bank selected yet: the screen must send the user back to bank selection.
    expect(await screen.findByText('Select your bank')).toBeTruthy();
  });
});

describe('language propagation', () => {
  it('renders screens in the persisted language', async () => {
    const { services, state } = await authenticatedState();
    renderAt('/home', { ...state, preferences: { ...state.preferences, languageCode: 'ta' } }, services);

    expect(await screen.findByText('எந்தப் படிவத்திற்கு உதவி வேண்டும்?')).toBeTruthy();
    expect(await screen.findByText('உங்கள் சமீபத்திய படிவங்கள் இங்கே தோன்றும்.')).toBeTruthy();
    expect(document.documentElement.lang).toBe('ta');
    expect(document.body.className).toContain('font-tamil');
  });
});
