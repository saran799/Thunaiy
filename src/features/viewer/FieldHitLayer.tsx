import type { FormFieldRect } from './types';

interface Props {
  fields: FormFieldRect[];
  selectedFieldId: string | null;
  /** Translated, screen-reader friendly description of a field. */
  describeField: (field: FormFieldRect) => string;
  onSelectField: (field: FormFieldRect) => void;
}

/**
 * Transparent tap targets over the highlighted fields. It sits above the
 * artwork (z-3) but paints nothing itself: only the selected field shows a
 * state, using the same inset outline treatment as the selected rows on the
 * purpose screen, so the approved visual baseline is unchanged.
 */
export default function FieldHitLayer({ fields, selectedFieldId, describeField, onSelectField }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[3]">
      {fields
        .filter((field) => field.applicable)
        .map((field) => {
          const selected = field.id === selectedFieldId;
          return (
            <button
              key={field.id}
              type="button"
              aria-label={describeField(field)}
              aria-pressed={selected}
              data-field-id={field.id}
              onClick={() => onSelectField(field)}
              className={`pointer-events-auto absolute rounded-[2px] ${
                selected ? 'bg-guidance-tint shadow-[inset_0px_0px_0px_1.5px_#006874]' : 'bg-transparent'
              }`}
              style={{ left: field.x, top: field.y, width: field.width, height: field.height }}
            />
          );
        })}
    </div>
  );
}
