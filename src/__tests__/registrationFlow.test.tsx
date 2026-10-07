import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';
import AppProviders from '../app/AppProviders';
import { initialAppState } from '../state/appState';
import { createTestServices } from '../test/fixtures';

function renderApp(services: ReturnType<typeof createTestServices>['services'], path = '/register') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProviders services={services} initialState={initialAppState} persist={false}>
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

/**
 * Walks registration -> OTP -> language through the real screens and the
 * development backend. This is the flow a first-time user sees.
 */
describe('registration flow', () => {
  it('validates the form before requesting an OTP', async () => {
    const { services } = createTestServices();
    renderApp(services);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'A' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '12345' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));

    expect(await screen.findByText('Enter your full name (at least 2 characters).')).toBeTruthy();
    expect(await screen.findByText('Enter a valid 10-digit Indian mobile number.')).toBeTruthy();
    // Still on registration: no OTP was requested.
    expect(screen.queryByText('Verify your mobile number')).toBeNull();
  });

  it('registers, verifies the OTP and continues with a chosen language', async () => {
    const { services } = createTestServices();
    renderApp(services);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: '  Jabaraj  ' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));

    // OTP screen, showing the phone number the code went to.
    expect(await screen.findByText('Verify your mobile number')).toBeTruthy();
    expect(await screen.findByText('+91 98765 43210')).toBeTruthy();

    // The development backend surfaces the code it would have sent by SMS.
    const devCode = await screen.findByText(/^\d{6}$/);

    typeOtp(devCode.textContent!);
    fireEvent.click(screen.getByRole('button', { name: 'Verify & Continue' }));

    // Signed in: onboarding continues with the language step.
    expect(await screen.findByText('Choose your language')).toBeTruthy();

    fireEvent.click(screen.getByText('தமிழ்'));
    // Choosing a language applies it immediately, so the CTA is already Tamil.
    fireEvent.click(screen.getByRole('button', { name: 'தொடரவும்' }));

    await waitFor(() => expect(document.documentElement.lang).toBe('ta'));
    expect(await screen.findByText('உங்கள் வங்கியைத் தேர்ந்தெடுக்கவும்')).toBeTruthy();
  });

  it('rejects an incorrect code without signing the user in', async () => {
    const { services } = createTestServices();
    renderApp(services);

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Jabaraj' } });
    fireEvent.change(screen.getByLabelText('Mobile number'), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }));
    await screen.findByText('Verify your mobile number');

    typeOtp('000000');
    fireEvent.click(screen.getByRole('button', { name: 'Verify & Continue' }));

    expect(await screen.findByText(/Incorrect OTP\. \d+ attempts left\./)).toBeTruthy();
    expect(screen.queryByText('Choose your language')).toBeNull();
  });
});
