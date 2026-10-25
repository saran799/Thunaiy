import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

interface Props {
  pdfUrl?: string;
  pageNumber: number;
  bounds: [number, number, number, number]; // [x, y, width, height] in PDF points (595.28 x 841.89)
  label: string;
  example?: string;
  className?: string;
}

// In-memory cache for loaded PDF documents
const docCache = new Map<string, Promise<pdfjsLib.PDFDocumentProxy>>();

function getCachedDoc(url: string): Promise<pdfjsLib.PDFDocumentProxy> {
  let promise = docCache.get(url);
  if (!promise) {
    promise = pdfjsLib.getDocument({
      url,
      cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
      cMapPacked: true,
    }).promise;
    docCache.set(url, promise);
  }
  return promise;
}

/**
 * Dedicated high-resolution, zoomable field crop derived directly from the official PDF.
 * Ensures the physical form text and boxes are sharply readable on mobile and desktop
 * without forcing the user to squint at a shrunken 9-page document.
 */
export default function FieldMagnifier({
  pdfUrl,
  pageNumber,
  bounds,
  label,
  example,
  className = '',
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(2.2); // Default 2.2x magnification
  const [status, setStatus] = useState<'loading' | 'rendered' | 'fallback'>('loading');

  const [x, y, width, height] = bounds;

  useEffect(() => {
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    if (!pdfUrl || pageNumber <= 0) {
      setStatus('fallback');
      return;
    }

    // JSDOM / test runner check
    const isJsdom =
      typeof navigator !== 'undefined' &&
      (navigator.userAgent?.includes('jsdom') ||
        typeof (window as any).CanvasRenderingContext2D === 'undefined');

    if (isJsdom) {
      setStatus('fallback');
      return;
    }

    async function renderCrop() {
      setStatus('loading');
      const canvas = canvasRef.current;
      if (!canvas) return;

      let ctx: CanvasRenderingContext2D | null = null;
      try {
        ctx = canvas.getContext('2d');
      } catch {
        ctx = null;
      }

      if (!ctx) {
        setStatus('fallback');
        return;
      }

      try {
        const doc = await getCachedDoc(pdfUrl!);
        if (cancelled) return;

        const safePageNum = Math.min(Math.max(1, pageNumber), doc.numPages);
        const page = await doc.getPage(safePageNum);
        if (cancelled) return;

        // Render at high resolution
        const scale = zoomLevel;
        const viewport = page.getViewport({ scale });

        // Add padding around field bounds for context (15pt on all sides)
        const pad = 14;
        const cropX = Math.max(0, x - pad);
        const cropY = Math.max(0, y - pad);
        const cropW = Math.min(595.28 - cropX, width + pad * 2);
        const cropH = Math.min(841.89 - cropY, height + pad * 2);

        // Dimensions of canvas
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        const displayW = Math.floor(cropW * scale);
        const displayH = Math.floor(cropH * scale);

        canvas.width = Math.floor(displayW * dpr);
        canvas.height = Math.floor(displayH * dpr);
        canvas.style.width = '100%';
        canvas.style.height = `${displayH}px`;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, displayW, displayH);

        // We render the page into an offscreen canvas or temporary viewport shifted by (-cropX, -cropY)
        const offscreen = document.createElement('canvas');
        offscreen.width = Math.floor(viewport.width);
        offscreen.height = Math.floor(viewport.height);
        const offCtx = offscreen.getContext('2d');

        if (!offCtx) {
          setStatus('fallback');
          return;
        }

        renderTask = page.render({
          canvasContext: offCtx,
          viewport,
        });

        await renderTask.promise;
        if (cancelled) return;

        // Draw the cropped region onto our display canvas
        ctx.drawImage(
          offscreen,
          Math.floor(cropX * scale),
          Math.floor(cropY * scale),
          Math.floor(cropW * scale),
          Math.floor(cropH * scale),
          0,
          0,
          displayW,
          displayH,
        );

        // Draw a neat subtle teal focus outline around the exact field bounding box inside the crop
        const boxX = (x - cropX) * scale;
        const boxY = (y - cropY) * scale;
        const boxW = width * scale;
        const boxH = height * scale;

        ctx.strokeStyle = '#0F766E'; // teal-700
        ctx.lineWidth = 2.5;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        setStatus('rendered');
      } catch (err) {
        if (!cancelled) {
          setStatus('fallback');
        }
      }
    }

    renderCrop();

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // Ignore
        }
      }
    };
  }, [pdfUrl, pageNumber, x, y, width, height, zoomLevel]);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-teal/20 bg-surface-1 shadow-md ${className}`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-surface-3 bg-surface-2/90 px-3 py-1.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-teal" aria-hidden="true" />
          <span className="text-[11px] font-semibold text-deep uppercase tracking-wider">
            {pageNumber > 0 ? `Physical Form • Page ${pageNumber}` : 'Document Checklist'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(1.4, z - 0.4))}
            aria-label="Zoom out field"
            className="flex size-6 items-center justify-center rounded-md bg-white text-xs font-bold text-deep shadow-xs hover:bg-surface-2"
          >
            -
          </button>
          <span className="font-mono text-[11px] text-muted">
            {Math.round(zoomLevel * 50)}%
          </span>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(3.4, z + 0.4))}
            aria-label="Zoom in field"
            className="flex size-6 items-center justify-center rounded-md bg-white text-xs font-bold text-deep shadow-xs hover:bg-surface-2"
          >
            +
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative min-h-[110px] max-h-[220px] overflow-auto bg-white p-2">
        {status === 'loading' && (
          <div className="flex h-24 items-center justify-center gap-2 text-xs text-muted">
            <div className="size-4 animate-spin rounded-full border-2 border-teal border-t-transparent" />
            <span>Loading magnified field...</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`block max-w-full ${status === 'rendered' ? 'block' : 'hidden'}`}
          aria-label={`Magnified crop of ${label}`}
        />

        {status === 'fallback' && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-teal/30 bg-teal/5 p-4 text-center">
            <span className="text-[11px] font-medium text-teal uppercase tracking-wide">
              Field Focus Box
            </span>
            <p className="mt-1 font-semibold text-deep text-sm">{label}</p>
            {example && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-xs font-mono text-ink shadow-xs border border-surface-3">
                <span className="text-muted text-[10px]">SAMPLE:</span>
                <span className="font-semibold text-teal">{example}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Pill */}
      <div className="flex items-center justify-between border-t border-surface-3 bg-surface-2/60 px-3 py-1 text-[11px] text-muted">
        <span className="truncate max-w-[240px] font-medium text-ink">{label}</span>
        <span className="text-teal font-medium">Original Bank Layout</span>
      </div>
    </div>
  );
}
