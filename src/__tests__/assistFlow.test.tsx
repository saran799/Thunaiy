import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import AppProviders from '../app/AppProviders';

const APP_STATE_KEY = 'thunaiy.app.v1';

function renderApp(initialPath: string) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppProviders>
        <App />
      </AppProviders>
    </MemoryRouter>,
  );
}

describe('public QR assistance journey', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('runs through the whole assist flow without authentication', async () => {
    const { unmount } = renderApp('/assist/sbi-koramangala');

    // Language step.
    expect(await screen.findByText('Choose your language')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Form step: branch auto-selects SBI, skipping bank selection.
    // 'Account Opening Form' should be available.
    expect(await screen.findByText('Select your form')).toBeTruthy();
    expect(await screen.findByText('Account Opening Form')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Purpose step.
    expect(await screen.findByText('What are you using this form for?')).toBeTruthy();
    fireEvent.click(await screen.findByRole('radio', { name: /Open a new account/ }));
    fireEvent.click(screen.getByRole('button', { name: 'View My Form' }));

    // Viewer.
    expect(await screen.findByText('Account Opening Form Page 1')).toBeTruthy();
    expect(await screen.findByText('6 required fields')).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Show guidance for 2. Applicant Full Name'));
    expect(await screen.findByText(/Write your name in block capitals/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mark as done' }));
    fireEvent.click(screen.getByRole('button', { name: 'Finish guidance' }));

    // Completion
    expect(await screen.findByText('Done!')).toBeTruthy();

    // Verify localStorage only contains the initial unauthenticated state from the root provider,
    // and that the assist flow did NOT leak any of its selections into it.
    const persisted = JSON.parse(localStorage.getItem(APP_STATE_KEY) ?? '{}');
    expect(persisted.session).toBeNull();
    expect(persisted.selections.bankId).toBeNull();
    expect(persisted.selections.bankFormId).toBeNull();

    unmount();
  });

  it('shows an error state for invalid branch IDs', async () => {
    const { unmount } = renderApp('/assist/invalid-branch-id');
    
    expect(await screen.findByText('Something went wrong')).toBeTruthy();
    expect(await screen.findByText('This QR code is invalid or the branch could not be found.')).toBeTruthy();

    unmount();
  });

  it('allows going back to bank selection and returns to assist flow', async () => {
    const { unmount } = renderApp('/assist/sbi-koramangala/form');

    expect(await screen.findByText('Select your form')).toBeTruthy();
    
    // Click Change bank
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));

    expect(await screen.findByText('Select your bank')).toBeTruthy();
    fireEvent.click(await screen.findByRole('radio', { name: /HDFC Bank/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Back to form selection, should now show HDFC forms (which we know is empty right now, or shows the change bank UI)
    expect(await screen.findByText('Select your form')).toBeTruthy();
    
    unmount();
  });
});
