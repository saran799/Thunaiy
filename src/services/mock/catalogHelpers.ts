import type {
  Bank,
  BankForm,
  BankFormListItem,
  DirectoryFormItem,
  FormType,
  FormVersion,
  Purpose,
} from '../../domain/types';
import type { MockCatalog } from './seed';

/**
 * Pure query helpers over the catalogue. The mock services use them, and the
 * tests cover them directly: bank -> forms, form -> purposes, purpose -> fields
 * and version -> document resolution all live here and nowhere else.
 */

export function activeBanks(catalog: MockCatalog): Bank[] {
  return catalog.banks
    .filter((bank) => bank.isActive)
    .sort((a, b) => Number(b.popular) - Number(a.popular) || a.name.localeCompare(b.name));
}

export function bankById(catalog: MockCatalog, bankId: string): Bank | null {
  return catalog.banks.find((bank) => bank.id === bankId && bank.isActive) ?? null;
}

export function formTypeById(catalog: MockCatalog, formTypeId: string): FormType | null {
  return catalog.formTypes.find((formType) => formType.id === formTypeId) ?? null;
}

export function bankFormById(catalog: MockCatalog, bankFormId: string): BankForm | null {
  return catalog.bankForms.find((bankForm) => bankForm.id === bankFormId && bankForm.isActive) ?? null;
}

export function bankFormsForBank(catalog: MockCatalog, bankId: string): BankForm[] {
  return catalog.bankForms.filter((bankForm) => bankForm.bankId === bankId && bankForm.isActive);
}

export function purposesForBankForm(catalog: MockCatalog, bankFormId: string): Purpose[] {
  return catalog.purposes.filter((purpose) => purpose.bankFormId === bankFormId).sort((a, b) => a.sort - b.sort);
}

export function purposeById(catalog: MockCatalog, purposeId: string): Purpose | null {
  return catalog.purposes.find((purpose) => purpose.id === purposeId) ?? null;
}

/** Published versions of a bank form, newest first. */
export function publishedVersions(catalog: MockCatalog, bankFormId: string): FormVersion[] {
  return catalog.formVersions
    .filter((version) => version.bankFormId === bankFormId && version.status === 'published')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function versionById(catalog: MockCatalog, versionId: string): FormVersion | null {
  return catalog.formVersions.find((version) => version.id === versionId) ?? null;
}

/** A version is usable in the viewer once artwork and geometry exist. */
export function versionHasArtwork(catalog: MockCatalog, versionId: string): boolean {
  return catalog.formPages.some((page) => page.formVersionId === versionId);
}

/** purposeId -> applicable field ids, for one form version. */
export function applicabilityMapForVersion(catalog: MockCatalog, versionId: string): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const row of catalog.applicability) {
    if (row.formVersionId !== versionId || !row.applicable) continue;
    (map[row.purposeId] ??= []).push(row.fieldId);
  }
  return map;
}

export function applicableFieldIds(catalog: MockCatalog, versionId: string, purposeId: string): string[] {
  return applicabilityMapForVersion(catalog, versionId)[purposeId] ?? [];
}

/** Fields a purpose highlights that are mandatory on the physical form. */
export function requiredFieldIds(catalog: MockCatalog, versionId: string, purposeId: string): string[] {
  const applicable = new Set(applicableFieldIds(catalog, versionId, purposeId));
  return catalog.formFields
    .filter((field) => field.formVersionId === versionId && applicable.has(field.id) && field.required)
    .map((field) => field.id);
}

/**
 * Version that should be used for a bank form + purpose:
 * the newest published version that declares applicability for the purpose and
 * has artwork. Feeds the "form not available yet" path when nothing matches.
 */
export function resolveVersionForPurpose(
  catalog: MockCatalog,
  bankFormId: string,
  purposeId: string,
): FormVersion | null {
  const versions = publishedVersions(catalog, bankFormId);
  const withPurpose = versions.find(
    (version) =>
      versionHasArtwork(catalog, version.id) &&
      catalog.applicability.some((row) => row.formVersionId === version.id && row.purposeId === purposeId),
  );
  return withPurpose ?? versions[0] ?? null;
}

export function bankFormListItems(catalog: MockCatalog, bankId: string): BankFormListItem[] {
  return bankFormsForBank(catalog, bankId).flatMap((bankForm) => {
    const formType = formTypeById(catalog, bankForm.formTypeId);
    if (!formType) return [];
    const available = publishedVersions(catalog, bankForm.id).some((version) => versionHasArtwork(catalog, version.id));
    return [
      {
        bankFormId: bankForm.id,
        formTypeId: formType.id,
        titleKey: formType.titleKey,
        descriptionKey: formType.descriptionKey,
        icon: formType.icon,
        available,
      },
    ];
  });
}

export function directoryItems(catalog: MockCatalog): DirectoryFormItem[] {
  return catalog.bankForms.flatMap((bankForm) => {
    const bank = bankById(catalog, bankForm.bankId);
    const formType = formTypeById(catalog, bankForm.formTypeId);
    if (!bank || !formType) return [];
    const available = publishedVersions(catalog, bankForm.id).some((version) => versionHasArtwork(catalog, version.id));
    return [
      {
        bankFormId: bankForm.id,
        bankId: bank.id,
        bankName: bank.name,
        formTypeId: formType.id,
        titleKey: formType.titleKey,
        descriptionKey: formType.descriptionKey,
        icon: formType.icon,
        purposeLabelKeys: purposesForBankForm(catalog, bankForm.id).map((purpose) => purpose.labelKey),
        available,
      },
    ];
  });
}
