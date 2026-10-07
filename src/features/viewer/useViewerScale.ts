import { useEffect, useRef, useState } from 'react';

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
    const update = () => setFit(el.clientWidth / intrinsicWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [intrinsicWidth]);

  return { ref, fit };
}

/**
 * Zoom state for the viewer. The current screen renders at zoom = 1 (Figma "100%").
 * Wiring zoom in / out / fit and pan gestures is the next development phase; the hook is the extension point.
 */
export function useViewerZoom(initial = 1) {
  const [zoom, setZoom] = useState(initial);
  const clamp = (z: number) => Math.min(3, Math.max(0.5, z));
  return {
    zoom,
    zoomIn: () => setZoom((z) => clamp(z + 0.25)),
    zoomOut: () => setZoom((z) => clamp(z - 0.25)),
    reset: () => setZoom(1),
  };
}
