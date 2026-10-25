import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Configure the worker source for Vite in browser environments
if (typeof window !== 'undefined') {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    }
  } catch {
    // Graceful fallback for non-browser or test runners
  }
}

// In-memory cache for loaded PDF documents to avoid re-fetching
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

interface Props {
  pdfUrl: string;
  pageNumber: number;
  width?: number;
  height?: number;
  className?: string;
  onDimensionsLoaded?: (dims: { width: number; height: number }) => void;
}

/**
 * Renders an authentic PDF page directly from the bank's original PDF file
 * onto an HTML canvas with crisp resolution and exact coordinates.
 * In test/JSDOM environments where canvas 2D is unsupported, renders a clean
 * fallback page container.
 */
export default function PdfPageCanvas({
  pdfUrl,
  pageNumber,
  width,
  height,
  className = '',
  onDimensionsLoaded,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'rendered' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    async function renderPage() {
      setStatus('loading');
      const canvas = canvasRef.current;
      if (!canvas) return;

      // JSDOM / test check without node-canvas
      const isJsdom = typeof navigator !== 'undefined' && (
        navigator.userAgent?.includes('jsdom') ||
        typeof (window as any).CanvasRenderingContext2D === 'undefined'
      );

      if (isJsdom) {
        setStatus('rendered');
        return;
      }

      let ctx: CanvasRenderingContext2D | null = null;
      try {
        ctx = canvas.getContext('2d');
      } catch {
        ctx = null;
      }

      if (!ctx) {
        setStatus('rendered');
        return;
      }

      try {
        const doc = await getCachedDoc(pdfUrl);
        if (cancelled) return;

        const safePageNum = Math.min(Math.max(1, pageNumber), doc.numPages);
        const page = await doc.getPage(safePageNum);
        if (cancelled) return;

        const unscaledViewport = page.getViewport({ scale: 1.0 });
        onDimensionsLoaded?.({
          width: unscaledViewport.width,
          height: unscaledViewport.height,
        });

        const targetWidth = width ?? unscaledViewport.width;
        const scale = targetWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderTask = page.render({
          canvasContext: ctx,
          viewport,
          transform,
        });

        await renderTask.promise;
        if (!cancelled) {
          setStatus('rendered');
        }
      } catch (err: any) {
        if (err?.name === 'RenderingCancelledException') return;
        if (!cancelled) {
          // If PDF loading fails in test or restricted environment, fall back gracefully
          setStatus('error');
        }
      }
    }

    renderPage();

    return () => {
      cancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // Ignore cancellation errors
        }
      }
    };
  }, [pdfUrl, pageNumber, width, onDimensionsLoaded]);

  return (
    <div
      className={`relative overflow-hidden bg-white ${className}`}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '100%',
      }}
    >
      <canvas
        ref={canvasRef}
        className="block size-full"
        aria-hidden="true"
      />
      {status === 'loading' && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-surface-1/40"
          aria-hidden="true"
        >
          <div className="size-[24px] animate-spin rounded-full border-2 border-teal border-t-transparent" />
        </div>
      )}
    </div>
  );
}
