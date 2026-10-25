import type { ReactNode, Ref } from 'react';
import type { FormFieldRect, FormPageSpec } from './types';
import HighlightOverlay from './HighlightOverlay';
import PdfPageCanvas from './PdfPageCanvas';
import { useFitScale } from './useViewerScale';

interface Props {
  page: FormPageSpec;
  fields: FormFieldRect[];
  zoom: number;
  pdfUrl?: string;
  children?: ReactNode;
  /** Invisible tap targets for field selection, drawn above the artwork. */
  hitLayer?: ReactNode;
  /** Lets the viewer track which page is on screen. */
  frameRef?: Ref<HTMLDivElement>;
}

/**
 * One form page: authentic bank PDF canvas + highlight overlay + hit layer, scaled
 * together as a single unit. When zoomed in beyond fit-width the page pans
 * horizontally inside its own scroll container instead of shrinking.
 */
export default function FormPageFrame({ page, fields, zoom, pdfUrl, children, hitLayer, frameRef }: Props) {
  const { ref, fit } = useFitScale(page.width);
  const scale = fit * zoom;

  return (
    <div ref={ref} className="w-full">
      <div className="w-full overflow-x-auto">
        <div
          ref={frameRef}
          data-page={page.page}
          className="mx-auto"
          style={{ width: page.width * scale, height: page.height * scale }}
        >
          <div
            className={`relative ${page.sheetClass}`}
            style={{
              width: page.width,
              height: page.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            {pdfUrl && (
              <PdfPageCanvas
                pdfUrl={pdfUrl}
                pageNumber={page.page}
                width={page.width}
                height={page.height}
                className="absolute inset-0 z-0 rounded-[2px]"
              />
            )}
            <HighlightOverlay fields={fields.filter((f) => f.page === page.page)} />
            {children && <div className="absolute inset-0 z-[2] pointer-events-none">{children}</div>}
            {hitLayer}
          </div>
        </div>
      </div>
    </div>
  );
}
