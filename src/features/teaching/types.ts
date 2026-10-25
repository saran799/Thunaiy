import type { LanguageCode } from '../../domain/types';

export type TeachingFieldType =
  | 'prep'
  | 'text'
  | 'date'
  | 'checkbox'
  | 'choice'
  | 'signature'
  | 'photograph'
  | 'bank_use';

export type TeachingFieldStatus =
  | 'mandatory'
  | 'optional'
  | 'conditional'
  | 'bank_use';

export type ConditionRule =
  | 'always'
  | 'if_married'
  | 'if_no_pan'
  | 'if_minor'
  | 'if_illiterate'
  | 'if_different_address'
  | 'if_nominee_minor';

export interface FieldTranslation {
  title: string;
  sectionName: string;
  explanation: string;
  speechScript: string;
  example?: string;
  whenToLeaveBlank?: string;
  conditionNote?: string;
}

export interface TeachingFieldRecord {
  id: string;
  sectionId: string;
  page: number; // 0 for preparation, 1 to 5 for form pages
  label: string; // printed label on official form
  bounds: [number, number, number, number]; // [x, y, width, height] in PDF points (595.28 x 841.89)
  fieldType: TeachingFieldType;
  status: TeachingFieldStatus;
  conditionRule?: ConditionRule;
  order: number;
  translations: Record<LanguageCode, FieldTranslation>;
  source: string;
  confidence: 'verified';
}

export interface TeachingSection {
  id: string;
  page: number;
  titleKey: string;
  titles: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
}
