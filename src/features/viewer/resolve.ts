import type { FieldProgress, FieldProgressState } from '../../domain/types';
import type { FormBundle, FormDocument, FormFieldRect } from './types';

/**
 * Guidance engine.
 *
 * Turns a raw FormBundle (geometry + purpose applicability + guidance) into the
 * view-model the viewer renders. This is the single place where
 * "is this field highlighted for this purpose" is decided, and it is
 * deterministic: applicability comes from the reviewed
 * purpose_field_applicability rows shipped with the form version — never from
 * inference.
 */

export type LabelResolver = (labelKey: string) => string;

export interface ResolveFormDocumentInput {
  bundle: FormBundle;
  purposeId: string;
  bankId: string;
  bankName: string;
  formTypeId: string;
  formTitleKey: string;
  purposeLabelKey: string;
  purposeShortLabelKey: string;
  /** fieldId -> "done" | "pending" for the active saved form. */
  progressByFieldId?: Record<string, FieldProgressState>;
  translate: LabelResolver;
}

/** Field ids this purpose highlights on the form. */
export function applicableFieldIdsForPurpose(bundle: FormBundle, purposeId: string): string[] {
  return bundle.applicability[purposeId] ?? [];
}

/** Mandatory fields among those the purpose highlights. */
export function requiredFieldIdsForPurpose(bundle: FormBundle, purposeId: string): string[] {
  const applicable = new Set(applicableFieldIdsForPurpose(bundle, purposeId));
  return bundle.fields.filter((field) => applicable.has(field.id) && field.required).map((field) => field.id);
}

/** fieldId -> state, built from user_field_progress rows. */
export function progressMap(rows: FieldProgress[]): Record<string, FieldProgressState> {
  const map: Record<string, FieldProgressState> = {};
  for (const row of rows) map[row.fieldId] = row.state;
  return map;
}

export function resolveFormDocument(input: ResolveFormDocumentInput): FormDocument {
  const applicable = new Set(applicableFieldIdsForPurpose(input.bundle, input.purposeId));
  const guidanceByFieldId = new Map(input.bundle.guidance.map((row) => [row.fieldId, row]));
  const progress = input.progressByFieldId ?? {};

  const fields: FormFieldRect[] = input.bundle.fields.map((field) => {
    const isApplicable = applicable.has(field.id);
    return {
      id: field.id,
      page: field.page,
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      applicable: isApplicable,
      required: isApplicable && field.required,
      label: input.translate(field.labelKey),
      fieldKey: field.fieldKey,
      guidance: guidanceByFieldId.get(field.id) ?? null,
      progress: progress[field.id] ?? 'pending',
    };
  });

  const requiredFields = fields.filter((field) => field.required);
  const doneFields = requiredFields.filter((field) => field.progress === 'done');

  return {
    bankId: input.bankId,
    bankName: input.bankName,
    bankFormId: input.bundle.version.bankFormId,
    formTypeId: input.formTypeId,
    formTitleKey: input.formTitleKey,
    versionId: input.bundle.version.id,
    versionLabel: input.bundle.version.versionLabel,
    artworkHash: input.bundle.version.artworkHash,
    purposeId: input.purposeId,
    purposeLabelKey: input.purposeLabelKey,
    purposeShortLabelKey: input.purposeShortLabelKey,
    languageCode: input.bundle.guidance[0]?.languageCode ?? 'en',
    pages: input.bundle.pages,
    fields,
    requiredCount: requiredFields.length,
    doneCount: doneFields.length,
  };
}
