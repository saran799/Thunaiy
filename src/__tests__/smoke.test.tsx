import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import AppProviders from '../app/AppProviders';

/**
 * Walks the whole product with the *shipped* wiring — the service registry that
 * `main.tsx` uses (in-browser development backend + persisted app state) rather
 * than injected test doubles. This is the closest thing to a browser pass that
 * runs in CI.
 */

const APP_STATE_KEY = 'thunaiy.app.v1';

function renderApp() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>,
  );
}

function typeOtp(code: string) {
  for (const [index, digit] of code.split('').entries()) {
    fireEvent.change(screen.getByLabelText(`One-time password ${index + 1}`), { target: { value: digit } });
  }
}

describe('full product smoke test (default services + persistence)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('goes from registration to a completed form, persisting selections along the way', async () => {
    renderApp();

    // "/" redirects to registration for a visitor with no session.
    expect(await screen.findByText('Welcome to Thunaiy')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jabaraj' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));

    // OTP: the development backend shows the code it "sent".
    const devCode = await screen.findByText(/^\d{6}$/);
    typeOtp(devCode.textContent!);
    fireEvent.click(screen.getByRole('button', { name: 'Verify & Continue' }));

    // Language step.
    expect(await screen.findByText('Choose your language')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Bank step: the first popular bank is preselected, choose SBI explicitly.
    expect(await screen.findByText('Select your bank')).toBeTruthy();
    fireEvent.click(await screen.findByRole('radio', { name: /State Bank of India/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Form step: SBI's account opening form is preselected.
    expect(await screen.findByText('Select your form')).toBeTruthy();
    expect(await screen.findByText('Account Opening Form')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Purpose step.
    expect(await screen.findByText('What are you using this form for?')).toBeTruthy();
    fireEvent.click(await screen.findByRole('radio', { name: /Open a new account/ }));
    fireEvent.click(screen.getByRole('button', { name: 'View My Form' }));

    // Viewer: the real document, with the purpose-specific highlight count.
    expect(await screen.findByText('Account Opening Form Page 1')).toBeTruthy();
    expect(await screen.findByText('6 required fields')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Show guidance for 2. Applicant Full Name'));
    expect(await screen.findByText(/Write your name in block capitals/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mark as done' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish guidance' }));

    // Completion, then back to Home with the saved form listed.
    expect(await screen.findByText('Form guidance complete')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Back to My Forms/ }));

    expect(await screen.findByText('Recent forms')).toBeTruthy();
    expect(await screen.findByText('Guidance completed')).toBeTruthy();

    // Selections survived navigation and were written to persistent storage.
    const persisted = JSON.parse(localStorage.getItem(APP_STATE_KEY) ?? '{}') as {
      selections?: Record<string, string | null>;
      session?: { user?: { phoneE164?: string } };
    };
    expect(persisted.session?.user?.phoneE164).toBe('+919876543210');
    expect(persisted.selections).toMatchObject({
      bankId: 'sbi',
      bankFormId: 'sbi::account-opening',
      purposeId: 'sbi::account-opening::open-new',
      formVersionId: 'sbi-aof-v1',
    });

    // A reload (fresh provider tree reading localStorage) keeps the user signed in.
    const reloaded = renderApp();
    expect(await screen.findByText('Recent forms')).toBeTruthy();
    reloaded.unmount();
  });

  it('sends an expired selection back to bank selection instead of failing', async () => {
    localStorage.clear();
    renderApp();

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jabaraj' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));
    const devCode = await screen.findByText(/^\d{6}$/);
    typeOtp(devCode.textContent!);
    fireEvent.click(screen.getByRole('button', { name: 'Verify & Continue' }));
    await screen.findByText('Choose your language');

    // A stored session with no bank chosen: /viewer must not crash or hang.
    localStorage.setItem(
      APP_STATE_KEY,
      JSON.stringify({
        session: JSON.parse(localStorage.getItem(APP_STATE_KEY)!).session,
        selections: { bankId: null, bankFormId: null, purposeId: null, formVersionId: null, savedFormId: null },
        preferences: { languageCode: 'en', showFieldGuidance: true },
      }),
    );

    const reloaded = render(
      <MemoryRouter initialEntries={['/viewer']}>
        <AppProviders>
          <App />
        </AppProviders>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Select your bank')).toBeTruthy();
    reloaded.unmount();
    await waitFor(() => expect(localStorage.getItem(APP_STATE_KEY)).toBeTruthy());
  });
});
