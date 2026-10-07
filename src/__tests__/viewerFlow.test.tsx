import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../App';
import AppProviders from '../app/AppProviders';
import { initialAppState, type AppState } from '../state/appState';
import { createTestServices } from '../test/fixtures';
import { intersect, pageElement } from '../test/intersection';
import { SBI_AOF_VERSION_ID, SBI_ACCOUNT_OPENING_BANK_FORM_ID } from '../services/mock/seed';

const PURPOSE_OPEN_NEW = `${SBI_ACCOUNT_OPENING_BANK_FORM_ID}::open-new`;

async function signedInViewerState(): Promise<{
  services: ReturnType<typeof createTestServices>['services'];
  state: AppState;
}> {
  const { services } = createTestServices();
  const challenge = await services.auth.requestOtp({ name: 'Jabaraj', phoneE164: '+919876543210' });
  const session = await services.auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });

  return {
    services,
    state: {
      ...initialAppState,
      session: { token: session.token, user: session.user, expiresAt: session.expiresAt },
      selections: {
        savedFormId: null,
        bankId: 'sbi',
        bankFormId: SBI_ACCOUNT_OPENING_BANK_FORM_ID,
        purposeId: PURPOSE_OPEN_NEW,
        formVersionId: SBI_AOF_VERSION_ID,
      },
    },
  };
}

function renderViewer(state: AppState, services: ReturnType<typeof createTestServices>['services']) {
  return render(
    <MemoryRouter initialEntries={['/viewer']}>
      <AppProviders services={services} initialState={state} persist={false}>
        <App />
      </AppProviders>
    </MemoryRouter>,
  );
}

/**
 * End-to-end exercise of the viewer: the resolved document renders the correct
 * form, the highlighted-field count follows the selected purpose, a field tap
 * opens real guidance, progress is stored and finishing lands on completion.
 */
describe('viewer flow', () => {
  it('renders the resolved document for the selected purpose', async () => {
    const { services, state } = await signedInViewerState();
    renderViewer(state, services);

    expect(await screen.findByText('Account Opening Form Page 1')).toBeTruthy();
    expect(await screen.findByText('6 required fields')).toBeTruthy();
    const indicator = document.querySelector('header button[aria-label^="Go to page"]');
    expect(indicator?.textContent).toBe('1 / 2');
    // The guidance pill reads "Highlighted in teal: 6 required fields for New Account".
    const pill = document.querySelector('main p');
    expect(pill?.textContent).toContain('for New Account');
    // One tap target per highlighted field (other artwork fields are inert).
    expect(document.querySelectorAll('button[data-field-id]').length).toBe(6);
  });

  it('honours the purpose when highlighting fields', async () => {
    const { services, state } = await signedInViewerState();
    renderViewer(
      { ...state, selections: { ...state.selections, purposeId: `${SBI_ACCOUNT_OPENING_BANK_FORM_ID}::update-details` } },
      services,
    );

    expect(await screen.findByText('3 required fields')).toBeTruthy();
    expect(document.querySelector('main p')?.textContent).toContain('for Update Details');
    expect(document.querySelectorAll('button[data-field-id]').length).toBe(3);
  });

  it('shows field guidance, stores progress and completes the form', async () => {
    const { services, state } = await signedInViewerState();
    renderViewer(state, services);

    fireEvent.click(await screen.findByLabelText('Show guidance for 2. Applicant Full Name'));

    const sheet = await screen.findByRole('dialog', { name: '2. Applicant Full Name' });
    expect(sheet.textContent).toContain('Write your name in block capitals exactly as it appears on your PAN or Aadhaar.');
    expect(sheet.textContent).toContain('0 of 6 highlighted fields marked done');

    fireEvent.click(screen.getByRole('button', { name: 'Mark as done' }));
    expect(await screen.findByText('1 of 6 highlighted fields marked done')).toBeTruthy();

    // Progress is persisted against the saved form, not just in component state.
    const summaries = await services.savedForms.listSummaries(state.session!.token);
    const progress = await services.savedForms.listFieldProgress(state.session!.token, summaries[0].id);
    expect(progress.filter((row) => row.state === 'done')).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Finish guidance' }));

    expect(await screen.findByText('Form guidance complete')).toBeTruthy();
    expect(await screen.findByText('Guidance completed')).toBeTruthy();
    expect((await services.savedForms.listSummaries(state.session!.token))[0].status).toBe('completed');
  });

  it('follows the page that scrolls into view', async () => {
    const { services, state } = await signedInViewerState();
    renderViewer(state, services);

    const indicator = () => document.querySelector('header button[aria-label^="Go to page"]')?.textContent;
    await screen.findByText('6 required fields');
    expect(indicator()).toBe('1 / 2');

    intersect(pageElement(2));
    await waitFor(() => expect(indicator()).toBe('2 / 2'));
  });

  it('zooms in, zooms out and returns to fit', async () => {
    const { services, state } = await signedInViewerState();
    renderViewer(state, services);
    await screen.findByText('6 required fields');

    const percent = () => screen.getByLabelText('Zoom in document').parentElement?.textContent ?? '';
    const pageFrame = () => document.querySelector('[data-page="1"]') as HTMLElement;

    expect(percent()).toContain('100%');
    const fitWidth = pageFrame().style.width;

    fireEvent.click(screen.getByLabelText('Zoom in document'));
    expect(percent()).toContain('125%');
    // The scaled page grows, so the whole document (overlay + tap targets) scales together.
    expect(pageFrame().style.width).not.toBe(fitWidth);
    expect((pageFrame().firstElementChild as HTMLElement).style.transform).toBe('scale(1.25)');

    fireEvent.click(screen.getByRole('button', { name: 'Reset document scale' }));
    expect(percent()).toContain('100%');
    expect(pageFrame().style.width).toBe(fitWidth);

    fireEvent.click(screen.getByLabelText('Zoom out document'));
    expect(percent()).toContain('75%');
  });

  it('does not open guidance when the preference is switched off', async () => {
    const { services, state } = await signedInViewerState();
    renderViewer({ ...state, preferences: { ...state.preferences, showFieldGuidance: false } }, services);

    await screen.findByText('6 required fields');
    expect(document.querySelectorAll('button[data-field-id]')).toHaveLength(0);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('marks the selected field while its guidance is open', async () => {
    const { services, state } = await signedInViewerState();
    renderViewer(state, services);

    const target = await screen.findByLabelText('Show guidance for 2. Applicant Full Name');
    expect(target.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(target);
    expect(await screen.findByRole('dialog', { name: '2. Applicant Full Name' })).toBeTruthy();
    expect(target.getAttribute('aria-pressed')).toBe('true');
  });
});
