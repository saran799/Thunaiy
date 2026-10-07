import type { FieldProgress, FieldProgressState, SavedForm, SavedFormSummary } from '../../domain/types';
import { ApiError } from '../errors';
import type { SavedFormService } from '../types';
import {
  bankById,
  bankFormById,
  formTypeById,
  requiredFieldIds,
  purposeById,
  versionById,
  versionHasArtwork,
} from './catalogHelpers';
import type { MockDb, SavedFormRecord } from './mockDb';
import type { MockCatalog } from './seed';

/** Saved forms, field progress and completion against the development backend. */
export class MockSavedFormService implements SavedFormService {
  constructor(
    private readonly db: MockDb,
    private readonly catalog: MockCatalog,
  ) {}

  async startOrResume(input: {
    token: string;
    bankId: string;
    bankFormId: string;
    formVersionId: string;
    purposeId: string;
  }): Promise<SavedForm> {
    const userId = this.requireUser(input.token);
    const version = versionById(this.catalog, input.formVersionId);
    if (!version || !versionHasArtwork(this.catalog, version.id)) {
      throw new ApiError('unavailable', 'This form is not available for guidance yet.');
    }

    const existing = this.db.findSavedForm({
      userId,
      formVersionId: version.id,
      purposeId: input.purposeId,
    });
    if (existing) {
      this.db.updateSavedForm(existing.id, { lastViewedAt: this.db.now().toISOString() });
      return existing;
    }

    return this.db.createSavedForm({
      userId,
      bankId: input.bankId,
      bankFormId: input.bankFormId,
      formVersionId: version.id,
      purposeId: input.purposeId,
    });
  }

  async get(token: string, savedFormId: string): Promise<SavedForm | null> {
    const userId = this.requireUser(token);
    const savedForm = this.db.getSavedForm(savedFormId);
    if (!savedForm || savedForm.userId !== userId) return null;
    return savedForm;
  }

  async getSummary(token: string, savedFormId: string): Promise<SavedFormSummary | null> {
    const userId = this.requireUser(token);
    const savedForm = this.db.getSavedForm(savedFormId);
    if (!savedForm || savedForm.userId !== userId) return null;
    return this.toSummary(savedForm);
  }

  async listSummaries(token: string, limit = 20): Promise<SavedFormSummary[]> {
    const userId = this.requireUser(token);
    return this.db
      .listSavedForms(userId)
      .map((savedForm) => this.toSummary(savedForm))
      .filter((summary): summary is SavedFormSummary => summary !== null)
      .slice(0, limit);
  }

  async setFieldProgress(input: {
    token: string;
    savedFormId: string;
    fieldId: string;
    state: FieldProgressState;
  }): Promise<FieldProgress[]> {
    this.requireOwnedForm(input.token, input.savedFormId);
    return this.db.setFieldProgress(input.savedFormId, input.fieldId, input.state);
  }

  async listFieldProgress(token: string, savedFormId: string): Promise<FieldProgress[]> {
    this.requireOwnedForm(token, savedFormId);
    return this.db.listFieldProgress(savedFormId);
  }

  async restore(token: string, savedFormId: string): Promise<SavedForm | null> {
    const savedForm = this.requireOwnedForm(token, savedFormId);
    this.db.updateSavedForm(savedForm.id, { lastViewedAt: this.db.now().toISOString() });
    return savedForm;
  }

  async complete(token: string, savedFormId: string): Promise<SavedForm> {
    const savedForm = this.requireOwnedForm(token, savedFormId);
    const now = this.db.now().toISOString();
    return (
      this.db.updateSavedForm(savedForm.id, {
        status: 'completed',
        completedAt: savedForm.completedAt ?? now,
        lastViewedAt: now,
      }) ?? savedForm
    );
  }

  private requireUser(token: string): string {
    const session = this.db.getActiveSession(token);
    if (!session) throw new ApiError('unauthorized', 'Your session has expired. Please sign in again.');
    return session.userId;
  }

  private requireOwnedForm(token: string, savedFormId: string): SavedFormRecord {
    const userId = this.requireUser(token);
    const savedForm = this.db.getSavedForm(savedFormId);
    if (!savedForm || savedForm.userId !== userId) {
      throw new ApiError('not_found', 'This saved form could not be found.');
    }
    return savedForm;
  }

  private toSummary(savedForm: SavedFormRecord): SavedFormSummary | null {
    const bank = bankById(this.catalog, savedForm.bankId);
    const bankForm = bankFormById(this.catalog, savedForm.bankFormId);
    const formType = bankForm ? formTypeById(this.catalog, bankForm.formTypeId) : null;
    const purpose = purposeById(this.catalog, savedForm.purposeId);
    const version = versionById(this.catalog, savedForm.formVersionId);
    if (!bank || !bankForm || !formType || !purpose || !version) return null;

    const required = requiredFieldIds(this.catalog, version.id, purpose.id);
    const done = this.db
      .listFieldProgress(savedForm.id)
      .filter((row) => row.state === 'done' && required.includes(row.fieldId)).length;

    return {
      ...savedForm,
      bankName: bank.name,
      formTitleKey: formType.titleKey,
      descriptionKey: formType.descriptionKey,
      purposeLabelKey: purpose.labelKey,
      purposeShortLabelKey: purpose.shortLabelKey,
      versionLabel: version.versionLabel,
      icon: formType.icon,
      requiredFields: required.length,
      doneFields: done,
    };
  }
}
