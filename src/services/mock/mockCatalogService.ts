import type {
  Bank,
  BankForm,
  BankFormListItem,
  DirectoryFormItem,
  FormVersion,
  LanguageOption,
  Purpose,
} from '../../domain/types';
import { LANGUAGES } from '../../domain/languages';
import type { BankFormDetail, CatalogService } from '../types';
import {
  activeBanks,
  bankById,
  bankFormById,
  bankFormListItems,
  bankFormsForBank,
  directoryItems,
  formTypeById,
  purposesForBankForm,
  purposeById,
  resolveVersionForPurpose,
  versionById,
} from './catalogHelpers';
import type { MockCatalog } from './seed';

/** Catalogue reads against the development backend dataset. */
export class MockCatalogService implements CatalogService {
  constructor(private readonly catalog: MockCatalog) {}

  async listLanguages(): Promise<LanguageOption[]> {
    return LANGUAGES;
  }

  async listBanks(): Promise<Bank[]> {
    return activeBanks(this.catalog);
  }

  async getBank(bankId: string): Promise<Bank | null> {
    return bankById(this.catalog, bankId);
  }

  async listBankForms(bankId: string): Promise<BankFormListItem[]> {
    return bankFormListItems(this.catalog, bankId);
  }

  async listDirectoryForms(): Promise<DirectoryFormItem[]> {
    return directoryItems(this.catalog);
  }

  async getBankForm(bankFormId: string): Promise<BankForm | null> {
    return bankFormById(this.catalog, bankFormId);
  }

  async getBankFormDetail(bankFormId: string): Promise<BankFormDetail | null> {
    const bankForm = bankFormById(this.catalog, bankFormId);
    if (!bankForm) return null;
    const bank = bankById(this.catalog, bankForm.bankId);
    const formType = formTypeById(this.catalog, bankForm.formTypeId);
    if (!bank || !formType) return null;
    return { bank, bankForm, formType };
  }

  async listPurposes(bankFormId: string): Promise<Purpose[]> {
    return purposesForBankForm(this.catalog, bankFormId);
  }

  async getPurpose(purposeId: string): Promise<Purpose | null> {
    return purposeById(this.catalog, purposeId);
  }

  async resolveVersion(bankFormId: string, purposeId: string): Promise<FormVersion | null> {
    return resolveVersionForPurpose(this.catalog, bankFormId, purposeId);
  }

  async getVersion(versionId: string): Promise<FormVersion | null> {
    return versionById(this.catalog, versionId);
  }

  /** Only used by the development backend/tests: banks are ordered popular-first. */
  async bankFormsForBankId(bankId: string): Promise<BankForm[]> {
    return bankFormsForBank(this.catalog, bankId);
  }
}
