import type { FieldGuidance, LanguageCode } from '../../domain/types';
import type { FormBundle, FormPageSpec } from '../../features/viewer/types';
import type { FormService } from '../types';
import { applicabilityMapForVersion, versionById, versionHasArtwork } from './catalogHelpers';
import type { MockCatalog } from './seed';

/** Form documents (pages, geometry, applicability, guidance) from the development dataset. */
export class MockFormService implements FormService {
  constructor(private readonly catalog: MockCatalog) {}

  async getFormBundle(input: {
    versionId: string;
    purposeId: string;
    languageCode: LanguageCode;
  }): Promise<FormBundle | null> {
    const version = versionById(this.catalog, input.versionId);
    if (!version || !versionHasArtwork(this.catalog, version.id)) return null;

    const pages: FormPageSpec[] = this.catalog.formPages
      .filter((page) => page.formVersionId === version.id)
      .map(({ formVersionId: _formVersionId, ...page }) => page)
      .sort((a, b) => a.page - b.page);

    const fields = this.catalog.formFields
      .filter((field) => field.formVersionId === version.id)
      .sort((a, b) => a.sort - b.sort);

    return {
      version,
      pages,
      fields,
      applicability: applicabilityMapForVersion(this.catalog, version.id),
      guidance: this.guidanceForFields(
        fields.map((field) => field.id),
        input.languageCode,
      ),
    };
  }

  async getFieldGuidance(fieldId: string, languageCode: LanguageCode): Promise<FieldGuidance | null> {
    return this.guidanceForFields([fieldId], languageCode)[0] ?? null;
  }

  /** Falls back to English when a field has no row in the requested language. */
  private guidanceForFields(fieldIds: string[], languageCode: LanguageCode): FieldGuidance[] {
    const rows: FieldGuidance[] = [];
    for (const fieldId of fieldIds) {
      const match =
        this.catalog.fieldGuidance.find((row) => row.fieldId === fieldId && row.languageCode === languageCode) ??
        this.catalog.fieldGuidance.find((row) => row.fieldId === fieldId && row.languageCode === 'en');
      if (match) rows.push(match);
    }
    return rows;
  }
}
