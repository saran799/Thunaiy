import type { FormFieldRect } from './types';

interface Props {
  fields: FormFieldRect[];
}

/**
 * Concise, friendly placeholders mapped to canonical field keys.
 * Short, non-obscuring text in subtle grey (#7A8793).
 */
const PLACEHOLDERS: Record<string, string> = {
  'full-name': 'Your name',
  'date-of-birth': 'Date of birth',
  mobile: 'Mobile number',
  address: 'Enter your address',
  'minor-guardian': "Father's / Mother's name",
  photo: 'Affix photo',
  'account-type': 'Select type',
  'staff-senior': 'Staff ID',
};

/**
 * Draws purpose-specific field highlights and non-intrusive light-grey placeholders
 * over the authentic bank PDF page.
 */
export default function HighlightOverlay({ fields }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      {fields
        .filter((f) => f.applicable)
        .map((f) => {
          const placeholder = PLACEHOLDERS[f.fieldKey] || '';
          // Ensure box has enough vertical and horizontal room for text without obscuring labels
          const canFitText = f.width >= 48 && f.height >= 16;

          return (
            <div
              key={f.id}
              data-field-id={f.id}
              className="absolute rounded-[3px] bg-guidance-tint border border-teal/40 overflow-hidden flex flex-col justify-start p-[2px] transition-all"
              style={{
                left: f.x,
                top: f.y,
                width: f.width,
                height: f.height,
              }}
            >
              {canFitText && placeholder && (
                <span
                  className="truncate font-sans text-[8.5px] font-medium leading-[11px] tracking-tight text-[#7A8793] select-none pl-px pt-px"
                  style={{ color: '#7A8793' }}
                >
                  {placeholder}
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
}
