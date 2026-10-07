import { describe, expect, it } from 'vitest';
import { MockFormService } from '../services/mock/mockFormService';
import { buildMockCatalog, SBI_AOF_VERSION_ID, SBI_ACCOUNT_OPENING_BANK_FORM_ID } from '../services/mock/seed';
import {
  applicableFieldIdsForPurpose,
  progressMap,
  requiredFieldIdsForPurpose,
  resolveFormDocument,
} from '../features/viewer/resolve';
import type { MockCatalog } from '../services/mock/seed';

const CATALOG = buildMockCatalog();
const FORMS = new MockFormService(CATALOG);

const PURPOSE = (code: string) => `${SBI_ACCOUNT_OPENING_BANK_FORM_ID}::${code}`;

/** Field keys highlighted for each purpose — the reviewed mapping from seed.ts. */
const EXPECTED_APPLICABILITY: Record<string, string[]> = {
  'open-new': ['account-type', 'photo', 'full-name', 'date-of-birth', 'mobile', 'address'],
  'minor-to-major': ['full-name', 'date-of-birth', 'mobile', 'address', 'minor-guardian'],
  'update-details': ['full-name', 'mobile', 'address'],
  'change-type': ['account-type', 'full-name', 'mobile'],
  other: ['full-name', 'mobile'],
};

async function bundleFor(purposeCode: string, languageCode: 'en' | 'ta' = 'en') {
  return FORMS.getFormBundle({
    versionId: SBI_AOF_VERSION_ID,
    purposeId: PURPOSE(purposeCode),
    languageCode,
  });
}

/** Purpose -> field applicability is per (version, purpose, field), not a boolean. */
describe('guidance engine: purpose -> field applicability', () => {
  it.each(Object.entries(EXPECTED_APPLICABILITY))('highlights the reviewed fields for %s', async (code, expected) => {
    const bundle = await bundleFor(code);
    expect(bundle).not.toBeNull();

    const applicableKeys = bundle!.fields
      .filter((field) => applicableFieldIdsForPurpose(bundle!, PURPOSE(code)).includes(field.id))
      .map((field) => field.fieldKey)
      .sort();

    expect(applicableKeys).toEqual([...expected].sort());
  });

  it('marks the same field differently for different purposes', async () => {
    const openNew = await bundleFor('open-new');
    const updateDetails = await bundleFor('update-details');

    const photoId = openNew!.fields.find((field) => field.fieldKey === 'photo')!.id;
    const minorId = openNew!.fields.find((field) => field.fieldKey === 'minor-guardian')!.id;

    expect(applicableFieldIdsForPurpose(openNew!, PURPOSE('open-new'))).toContain(photoId);
    expect(applicableFieldIdsForPurpose(updateDetails!, PURPOSE('update-details'))).not.toContain(photoId);
    expect(applicableFieldIdsForPurpose(updateDetails!, PURPOSE('update-details'))).not.toContain(minorId);
    expect(applicableFieldIdsForPurpose(openNew!, PURPOSE('minor-to-major'))).toContain(minorId);
  });

  it('counts only mandatory fields among the highlighted ones', async () => {
    const expectations: Array<[string, number]> = [
      ['open-new', 6],
      ['minor-to-major', 5],
      ['update-details', 3],
      ['change-type', 3],
      ['other', 2],
    ];
    for (const [code, count] of expectations) {
      const bundle = await bundleFor(code);
      expect(requiredFieldIdsForPurpose(bundle!, PURPOSE(code))).toHaveLength(count);
    }

    // "For branch office use" is never the applicant's job.
    const bundle = await bundleFor('open-new');
    const branchUseId = bundle!.fields.find((field) => field.fieldKey === 'branch-use')!.id;
    expect(requiredFieldIdsForPurpose(bundle!, PURPOSE('open-new'))).not.toContain(branchUseId);
  });

  it('never highlights geometry from another form version', async () => {
    const bundle = await bundleFor('open-new');
    expect(bundle!.fields.every((field) => field.formVersionId === SBI_AOF_VERSION_ID)).toBe(true);
    expect(bundle!.version.artworkHash).toBe(CATALOG.formVersions[0].artworkHash);
  });
});

describe('viewer document resolution', () => {
  it('resolves a document for the selected purpose, language and progress', async () => {
    const bundle = await bundleFor('open-new', 'ta');
    const document = resolveFormDocument({
      bundle: bundle!,
      purposeId: PURPOSE('open-new'),
      bankId: 'sbi',
      bankName: 'State Bank of India',
      formTypeId: 'account-opening',
      formTitleKey: 'form.accountOpening.title',
      purposeLabelKey: 'purpose.openNew',
      purposeShortLabelKey: 'purpose.openNew.short',
      progressByFieldId: progressMap([
        {
          savedFormId: 'sf_1',
          fieldId: bundle!.fields.find((field) => field.fieldKey === 'full-name')!.id,
          state: 'done',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]),
      translate: (key) => `t:${key}`,
    });

    expect(document.versionId).toBe(SBI_AOF_VERSION_ID);
    expect(document.bankName).toBe('State Bank of India');
    expect(document.requiredCount).toBe(6);
    expect(document.doneCount).toBe(1);
    expect(document.pages).toHaveLength(2);
    expect(document.languageCode).toBe('ta');

    const fullName = document.fields.find((field) => field.fieldKey === 'full-name')!;
    expect(fullName.label).toBe('t:field.fullName.label');
    expect(fullName.progress).toBe('done');
    expect(fullName.guidance?.languageCode).toBe('ta');

    const branchUse = document.fields.find((field) => field.fieldKey === 'branch-use')!;
    expect(branchUse.applicable).toBe(false);
    expect(branchUse.required).toBe(false);
  });

  it('returns nothing for an unknown version or a version without artwork', async () => {
    expect(await FORMS.getFormBundle({ versionId: 'nope', purposeId: PURPOSE('open-new'), languageCode: 'en' })).toBeNull();
    expect(
      await FORMS.getFormBundle({ versionId: 'canara::account-closure::v1', purposeId: 'x', languageCode: 'en' }),
    ).toBeNull();
  });

  it('falls back to English guidance when a language row is missing', async () => {
    const trimmed: MockCatalog = {
      ...CATALOG,
      fieldGuidance: CATALOG.fieldGuidance.filter(
        (row) => !(row.languageCode === 'ta' && row.fieldId.endsWith('::mobile')),
      ),
    };
    const forms = new MockFormService(trimmed);
    const bundle = await forms.getFormBundle({
      versionId: SBI_AOF_VERSION_ID,
      purposeId: PURPOSE('open-new'),
      languageCode: 'ta',
    });
    const mobileId = bundle!.fields.find((field) => field.fieldKey === 'mobile')!.id;
    expect(bundle!.guidance.find((row) => row.fieldId === mobileId)?.languageCode).toBe('en');
  });
});
