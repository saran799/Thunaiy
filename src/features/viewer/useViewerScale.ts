import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Scale that fits a page of `intrinsicWidth` into its container's width.
 * The page and its overlay are scaled together, so highlights stay locked to the form.
 */
export function useFitScale(intrinsicWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const width = el.clientWidth;
      if (width > 0) setFit(width / intrinsicWidth);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [intrinsicWidth]);

  return { ref, fit };
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

const clamp = (zoom: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

export interface ViewerZoom {
  zoom: number;
  /** Rounded percentage for the control pill. */
  percent: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Back to fit-width, i.e. the zoom the viewer opens at. */
  fit: () => void;
}

/**
 * Zoom state for the viewer. zoom = 1 means "fit the page to the container
 * width"; the page frame multiplies it by the measured fit scale.
 */
export function useViewerZoom(initial = 1): ViewerZoom {
  const [zoom, setZoom] = useState(clamp(initial));

  const zoomIn = useCallback(() => setZoom((current) => clamp(current + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((current) => clamp(current - ZOOM_STEP)), []);
  const fit = useCallback(() => setZoom(1), []);

  return {
    zoom,
    percent: Math.round(zoom * 100),
    canZoomIn: zoom < MAX_ZOOM,
    canZoomOut: zoom > MIN_ZOOM,
    zoomIn,
    zoomOut,
    fit,
  };
}
