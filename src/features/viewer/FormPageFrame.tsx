import type { ReactNode } from 'react';
import type { FormFieldRect, FormPageSpec } from './types';
import HighlightOverlay from './HighlightOverlay';
import { useFitScale } from './useViewerScale';

interface Props {
  page: FormPageSpec;
  fields: FormFieldRect[];
  zoom: number;
  children: ReactNode;
}

/** One form page: sheet + highlight overlay + artwork, scaled together as a single unit. */
export default function FormPageFrame({ page, fields, zoom, children }: Props) {
  const { ref, fit } = useFitScale(page.width);
  const scale = fit * zoom;
  return (
    <div ref={ref} className="w-full" style={{ height: page.height * scale }}>
      <div
        className={`relative ${page.sheetClass}`}
        style={{ width: page.width, height: page.height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        <HighlightOverlay fields={fields.filter((f) => f.page === page.page)} />
        <div className="absolute inset-0 z-[2]">{children}</div>
      </div>
    </div>
  );
}
