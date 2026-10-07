import type { FormFieldRect } from './types';

/**
 * Draws the guidance tint for every applicable field on a page, positioned in the page's own pixel space.
 * It is rendered between the white sheet and the form artwork, so the artwork's white cells sit on top of the tint
 * exactly as in the Figma design.
 */
export default function HighlightOverlay({ fields }: { fields: FormFieldRect[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden="true">
      {fields
        .filter((f) => f.applicable)
        .map((f) => (
          <div
            key={f.id}
            data-field-id={f.id}
            className="absolute rounded-[2px] bg-guidance-tint"
            style={{ left: f.x, top: f.y, width: f.width, height: f.height }}
          />
        ))}
    </div>
  );
}
