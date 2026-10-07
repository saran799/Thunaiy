import { describe, expect, it } from 'vitest';
import {
  bankFormsForBank,
  purposesForBankForm,
  resolveVersionForPurpose,
  versionHasArtwork,
} from '../services/mock/catalogHelpers';
import { buildMockCatalog, SBI_AOF_VERSION_ID, SBI_ACCOUNT_OPENING_BANK_FORM_ID } from '../services/mock/seed';
import { createTestServices } from '../test/fixtures';

/** Bank selection, form filtering and purpose filtering over the catalogue. */
describe('catalogue: bank -> form -> purpose', () => {
  it('lists banks popular-first and resolves a bank by id', async () => {
    const { services } = createTestServices();
    const banks = await services.catalog.listBanks();
    const popular = banks.filter((bank) => bank.popular);

    expect(banks.length).toBeGreaterThan(popular.length);
    // Popular banks first, then the rest; each group ordered by name.
    expect(banks.slice(0, popular.length).every((bank) => bank.popular)).toBe(true);
    expect(banks.slice(popular.length).every((bank) => !bank.popular)).toBe(true);
    const popularNames = popular.map((bank) => bank.name).sort((a, b) => a.localeCompare(b));
    expect(banks.slice(0, popular.length).map((bank) => bank.name)).toEqual(popularNames);
    expect(popular.map((bank) => bank.name).sort()).toEqual(
      ['Bank of Baroda', 'Canara Bank', 'HDFC Bank', 'ICICI Bank', 'State Bank of India'].sort(),
    );
    expect((await services.catalog.getBank('sbi'))?.name).toBe('State Bank of India');
    expect(await services.catalog.getBank('does-not-exist')).toBeNull();
  });

  it('returns only the forms that belong to the selected bank', async () => {
    const { services } = createTestServices();

    const sbiForms = await services.catalog.listBankForms('sbi');
    const canaraForms = await services.catalog.listBankForms('canara');

    expect(sbiForms.map((form) => form.formTypeId)).toContain('account-opening');
    expect(canaraForms.map((form) => form.formTypeId)).toEqual(['account-closure', 'kyc-update']);
    expect(canaraForms.some((form) => form.formTypeId === 'account-opening')).toBe(false);

    // Only the measured SBI Account Opening Form has artwork today.
    expect(sbiForms.find((form) => form.formTypeId === 'account-opening')?.available).toBe(true);
    expect(canaraForms.every((form) => form.available === false)).toBe(true);
  });

  it('returns only the purposes that belong to the selected form', async () => {
    const { services } = createTestServices();

    const accountOpening = await services.catalog.listPurposes('sbi::account-opening');
    const nomination = await services.catalog.listPurposes('sbi::nomination');

    expect(accountOpening.map((purpose) => purpose.id)).toEqual([
      'sbi::account-opening::open-new',
      'sbi::account-opening::minor-to-major',
      'sbi::account-opening::update-details',
      'sbi::account-opening::change-type',
      'sbi::account-opening::other',
    ]);
    expect(nomination.map((purpose) => purpose.labelKey)).toEqual(['purpose.addNominee', 'purpose.updateNominee']);
    expect(accountOpening.some((purpose) => purpose.bankFormId !== 'sbi::account-opening')).toBe(false);
  });

  it('builds the forms directory with bank names and purpose keys for search', async () => {
    const { services } = createTestServices();
    const directory = await services.catalog.listDirectoryForms();

    const sbiAccountOpening = directory.find((item) => item.bankFormId === SBI_ACCOUNT_OPENING_BANK_FORM_ID);
    expect(sbiAccountOpening?.bankName).toBe('State Bank of India');
    expect(sbiAccountOpening?.titleKey).toBe('form.accountOpening.title');
    expect(sbiAccountOpening?.purposeLabelKeys.length).toBe(5);
    expect(directory.length).toBeGreaterThanOrEqual(20);
  });

  it('resolves the published version for a purpose, and rejects unknown purposes', async () => {
    const { services } = createTestServices();
    const version = await services.catalog.resolveVersion(
      SBI_ACCOUNT_OPENING_BANK_FORM_ID,
      'sbi::account-opening::open-new',
    );
    expect(version?.id).toBe(SBI_AOF_VERSION_ID);
    expect(version?.versionLabel).toBe('SBI-AOF-VER4-DEC2023');
  });

  it('treats versions without artwork as unavailable', () => {
    const catalog = buildMockCatalog();
    expect(versionHasArtwork(catalog, SBI_AOF_VERSION_ID)).toBe(true);

    const canara = bankFormsForBank(catalog, 'canara')[0];
    const canaraVersion = resolveVersionForPurpose(catalog, canara.id, purposesForBankForm(catalog, canara.id)[0].id);
    expect(canaraVersion).not.toBeNull();
    expect(versionHasArtwork(catalog, canaraVersion!.id)).toBe(false);
  });
});
