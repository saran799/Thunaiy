import { beforeEach, describe, expect, it } from 'vitest';
import { SBI_AOF_VERSION_ID, SBI_ACCOUNT_OPENING_BANK_FORM_ID } from '../services/mock/seed';
import { createTestServices, TEST_NAME, TEST_PHONE } from '../test/fixtures';
import type { Services } from '../services/types';

let services: Services;
let token: string;
const PURPOSE_ID = `${SBI_ACCOUNT_OPENING_BANK_FORM_ID}::open-new`;

const startInput = () => ({
  token,
  bankId: 'sbi',
  bankFormId: SBI_ACCOUNT_OPENING_BANK_FORM_ID,
  formVersionId: SBI_AOF_VERSION_ID,
  purposeId: PURPOSE_ID,
});

beforeEach(async () => {
  services = createTestServices().services;
  const challenge = await services.auth.requestOtp({ name: TEST_NAME, phoneE164: TEST_PHONE });
  const session = await services.auth.verifyOtp({ challengeId: challenge.challengeId, code: challenge.devCode! });
  token = session.token;
});

describe('saved forms, progress and completion', () => {
  it('creates a saved form once and resumes it afterwards', async () => {
    const first = await services.savedForms.startOrResume(startInput());
    const second = await services.savedForms.startOrResume(startInput());

    expect(second.id).toBe(first.id);
    expect(first.status).toBe('in_progress');

    const summaries = await services.savedForms.listSummaries(token);
    expect(summaries).toHaveLength(1);
  });

  it('refuses to start a form whose version has no artwork yet', async () => {
    await expect(
      services.savedForms.startOrResume({ ...startInput(), formVersionId: 'canara::account-closure::v1' }),
    ).rejects.toMatchObject({ code: 'unavailable' });
  });

  it('tracks per-field progress for the active purpose only', async () => {
    const savedForm = await services.savedForms.startOrResume(startInput());
    const summaryBefore = await services.savedForms.getSummary(token, savedForm.id);
    expect(summaryBefore).toMatchObject({ requiredFields: 6, doneFields: 0 });

    const bundle = await services.forms.getFormBundle({ versionId: SBI_AOF_VERSION_ID, purposeId: PURPOSE_ID, languageCode: 'en' });
    const fullName = bundle!.fields.find((field) => field.fieldKey === 'full-name')!;
    const branchUse = bundle!.fields.find((field) => field.fieldKey === 'branch-use')!;

    await services.savedForms.setFieldProgress({ token, savedFormId: savedForm.id, fieldId: fullName.id, state: 'done' });
    // Not highlighted for this purpose, so it must not count towards progress.
    await services.savedForms.setFieldProgress({ token, savedFormId: savedForm.id, fieldId: branchUse.id, state: 'done' });

    const summary = await services.savedForms.getSummary(token, savedForm.id);
    expect(summary).toMatchObject({ requiredFields: 6, doneFields: 1 });

    const progress = await services.savedForms.listFieldProgress(token, savedForm.id);
    expect(progress.find((row) => row.fieldId === fullName.id)?.state).toBe('done');

    await services.savedForms.setFieldProgress({ token, savedFormId: savedForm.id, fieldId: fullName.id, state: 'pending' });
    expect(await services.savedForms.getSummary(token, savedForm.id)).toMatchObject({ doneFields: 0 });
  });

  it('persists completion state', async () => {
    const savedForm = await services.savedForms.startOrResume(startInput());
    const completed = await services.savedForms.complete(token, savedForm.id);

    expect(completed.status).toBe('completed');
    expect(completed.completedAt).not.toBeNull();

    const reloaded = await services.savedForms.get(token, savedForm.id);
    expect(reloaded?.status).toBe('completed');

    const summaries = await services.savedForms.listSummaries(token);
    expect(summaries[0].status).toBe('completed');
  });

  it('restores a saved form context for continue/open', async () => {
    const savedForm = await services.savedForms.startOrResume(startInput());
    const restored = await services.savedForms.restore(token, savedForm.id);

    expect(restored).toMatchObject({
      id: savedForm.id,
      bankId: 'sbi',
      bankFormId: SBI_ACCOUNT_OPENING_BANK_FORM_ID,
      formVersionId: SBI_AOF_VERSION_ID,
      purposeId: PURPOSE_ID,
    });
  });

  it('keeps saved forms private to their owner and requires a session', async () => {
    const savedForm = await services.savedForms.startOrResume(startInput());

    await expect(services.savedForms.listSummaries('bogus-token')).rejects.toMatchObject({ code: 'unauthorized' });
    await expect(services.savedForms.get('bogus-token', savedForm.id)).rejects.toMatchObject({ code: 'unauthorized' });

    const otherChallenge = await services.auth.requestOtp({ name: 'Other User', phoneE164: '+919000000001' });
    const otherSession = await services.auth.verifyOtp({
      challengeId: otherChallenge.challengeId,
      code: otherChallenge.devCode!,
    });

    expect(await services.savedForms.get(otherSession.token, savedForm.id)).toBeNull();
    expect(await services.savedForms.listSummaries(otherSession.token)).toEqual([]);
    await expect(
      services.savedForms.setFieldProgress({
        token: otherSession.token,
        savedFormId: savedForm.id,
        fieldId: 'anything',
        state: 'done',
      }),
    ).rejects.toMatchObject({ code: 'not_found' });
  });

  it('stores language and guidance preferences per user', async () => {
    const initial = await services.preferences.get(token);
    expect(initial).toMatchObject({ languageCode: 'en', showFieldGuidance: true });

    const updated = await services.preferences.update(token, { languageCode: 'ta', showFieldGuidance: false });
    expect(updated).toMatchObject({ languageCode: 'ta', showFieldGuidance: false });
    expect(await services.preferences.get(token)).toMatchObject({ languageCode: 'ta', showFieldGuidance: false });
  });
});
