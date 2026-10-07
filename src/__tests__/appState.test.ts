import { describe, expect, it } from 'vitest';
import {
  appReducer,
  initialAppState,
  parseAppState,
  type AppState,
  type SessionState,
} from '../state/appState';

const session: SessionState = {
  token: 'token-1',
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  user: { id: 'user_1', name: 'Jabaraj', phoneE164: '+919876543210', createdAt: '2026-01-01T00:00:00.000Z' },
};

describe('app state reducer', () => {
  it('stores the signed-in session and clears selections on sign-out', () => {
    const signedIn = appReducer(initialAppState, { type: 'session/signedIn', payload: session });
    expect(signedIn.session?.user.name).toBe('Jabaraj');

    const selected = appReducer(signedIn, { type: 'selection/bank', bankId: 'sbi' });
    const signedOut = appReducer(selected, { type: 'session/signedOut' });
    expect(signedOut.session).toBeNull();
    expect(signedOut.selections.bankId).toBeNull();
  });

  it('keeps the language preference across sign-out', () => {
    const state = appReducer(initialAppState, { type: 'preferences/language', languageCode: 'ta' });
    const signedOut = appReducer(state, { type: 'session/signedOut' });
    expect(signedOut.preferences.languageCode).toBe('ta');
  });

  it('selecting a bank resets form, purpose, version and saved form', () => {
    let state: AppState = appReducer(initialAppState, { type: 'selection/bank', bankId: 'sbi' });
    state = appReducer(state, { type: 'selection/bankForm', bankFormId: 'sbi::account-opening' });
    state = appReducer(state, { type: 'selection/purpose', purposeId: 'p1', formVersionId: 'v1' });
    expect(state.selections.formVersionId).toBe('v1');

    state = appReducer(state, { type: 'selection/bank', bankId: 'hdfc' });
    expect(state.selections).toMatchObject({
      bankId: 'hdfc',
      bankFormId: null,
      purposeId: null,
      formVersionId: null,
      savedFormId: null,
    });
  });

  it('selecting another form resets the purpose', () => {
    let state = appReducer(initialAppState, { type: 'selection/bank', bankId: 'sbi' });
    state = appReducer(state, { type: 'selection/bankForm', bankFormId: 'sbi::account-opening' });
    state = appReducer(state, { type: 'selection/purpose', purposeId: 'p1', formVersionId: 'v1' });
    state = appReducer(state, { type: 'selection/bankForm', bankFormId: 'sbi::kyc-update' });
    expect(state.selections.bankFormId).toBe('sbi::kyc-update');
    expect(state.selections.purposeId).toBeNull();
  });

  it('can restore a saved form context in one action', () => {
    const state = appReducer(initialAppState, {
      type: 'selection/openSavedForm',
      payload: { savedFormId: 'sf_1', bankId: 'sbi', bankFormId: 'sbi::account-opening', purposeId: 'p1', formVersionId: 'v1' },
    });
    expect(state.selections).toEqual({
      savedFormId: 'sf_1',
      bankId: 'sbi',
      bankFormId: 'sbi::account-opening',
      purposeId: 'p1',
      formVersionId: 'v1',
    });
  });

  it('drops an expired or malformed persisted session but keeps preferences', () => {
    const parsed = parseAppState({
      session: { token: 't', expiresAt: '2000-01-01T00:00:00.000Z', user: session.user },
      preferences: { languageCode: 'kn', showFieldGuidance: false },
    });
    expect(parsed.session).toBeNull();
    expect(parsed.preferences).toEqual({ languageCode: 'kn', showFieldGuidance: false });
  });

  it('ignores an unsupported persisted language', () => {
    const parsed = parseAppState({ preferences: { languageCode: 'fr', showFieldGuidance: true } });
    expect(parsed.preferences.languageCode).toBe('en');
  });
});
