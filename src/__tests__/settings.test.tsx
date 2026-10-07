import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';
import AppProviders from '../app/AppProviders';
import { initialAppState, type AppState } from '../state/appState';
import { createTestServices, TEST_NAME } from '../test/fixtures';

async function signedInState() {
  const { services } = createTestServices();
  const challenge = await services.auth.requestOtp({ name: TEST_NAME, phoneE164: '+919876543210' });
  const session = await services.auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });
  const state: AppState = {
    ...initialAppState,
    session: { token: session.token, user: session.user, expiresAt: session.expiresAt },
  };
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

describe('settings', () => {
  it('shows the signed-in user and stores the guidance preference', async () => {
    const { services, state } = await signedInState();
    renderAt('/settings', state, services);

    expect(await screen.findByText(TEST_NAME)).toBeTruthy();
    const toggle = await screen.findByRole('switch', { name: 'Show field guidance' });
    expect(toggle.getAttribute('aria-checked')).toBe('true');

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-checked')).toBe('false');

    await waitFor(async () => {
      expect((await services.preferences.get(state.session!.token)).showFieldGuidance).toBe(false);
    });
  });

  it('changes the language from settings and returns to settings', async () => {
    const { services, state } = await signedInState();
    renderAt('/settings', state, services);

    fireEvent.click(await screen.findByText('Language'));
    expect(await screen.findByText('Choose your language')).toBeTruthy();

    fireEvent.click(screen.getByText('हिन्दी'));
    fireEvent.click(screen.getByRole('button', { name: 'आगे बढ़ें' }));

    // Back on Settings, now in Hindi.
    // Header title and bottom nav both read "Settings" in Hindi.
    expect((await screen.findAllByText('सेटिंग्स')).length).toBeGreaterThan(0);
    await waitFor(() => expect(document.documentElement.lang).toBe('hi'));
  });

  it('logs out, revoking the session and returning to registration', async () => {
    const { services, state } = await signedInState();
    renderAt('/settings', state, services);

    fireEvent.click(await screen.findByText('Log out'));

    expect(await screen.findByText('Welcome to Thunaiy')).toBeTruthy();
    await expect(services.auth.restoreSession(state.session!.token)).rejects.toMatchObject({ code: 'unauthorized' });
  });
});
