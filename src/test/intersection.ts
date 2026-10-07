/**
 * Test double for IntersectionObserver that does not fire on `observe`.
 *
 * The viewer tracks which page is on screen with an observer; jsdom never
 * scrolls, so nothing would ever intersect. Tests drive visibility explicitly
 * with `intersect(...)` instead of relying on immediate callbacks.
 */

interface RegisteredObserver {
  callback: IntersectionObserverCallback;
  targets: Element[];
}

const observers = new Set<RegisteredObserver>();

export function registerObserver(observer: RegisteredObserver): void {
  observers.add(observer);
}

export function unregisterObserver(observer: RegisteredObserver): void {
  observers.delete(observer);
}

export function forgetObserver(observer: RegisteredObserver): void {
  observer.targets.length = 0;
}

/** Reports `target` as scrolled into (or out of) view to every live observer. */
export function intersect(target: Element, isIntersecting = true): void {
  for (const observer of Array.from(observers)) {
    if (!observer.targets.includes(target)) continue;
    observer.callback(
      [
        {
          target,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          time: 0,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
        } as unknown as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
  }
}

/** Page frames are rendered with a `data-page` attribute (see FormPageFrame). */
export function pageElement(page: number): Element {
  const element = document.querySelector(`[data-page="${page}"]`);
  if (!element) throw new Error(`No rendered page frame for page ${page}.`);
  return element;
}
