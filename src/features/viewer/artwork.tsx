import type { ComponentType } from 'react';
import type { FormFieldRect } from './types';

/** The drawn form content. Backgrounds of highlighted fields are transparent. */
interface ArtworkProps {
  fields: FormFieldRect[];
}

/**
 * Authentic Form Layout for SBI AOF Page 1.
 * The underlying bank document is rendered directly from the original PDF.
 * This overlay component preserves document integrity without synthetic HTML forms
 * or fictitious customer data.
 */
function SbiPage1({ fields: _fields }: ArtworkProps) {
  return (
    <div className="relative size-full pointer-events-none" aria-hidden="true">
      {/* Authentic original PDF is rendered as the visual foundation underneath */}
    </div>
  );
}

/** Maps FormPageSpec.artwork keys to the drawn page content. */
export const artworkRegistry: Record<string, ComponentType<ArtworkProps>> = {
  'sbi-aof-page-1': SbiPage1,
};
