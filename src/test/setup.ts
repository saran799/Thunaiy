/**
 * Test environment shims. jsdom has no ResizeObserver / IntersectionObserver /
 * scrollIntoView, which the viewer relies on for fit-scaling and page tracking.
 */
import { forgetObserver, registerObserver, unregisterObserver } from './intersection';

class NoopResizeObserver implements ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

class TestIntersectionObserver implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  private readonly targets: Element[] = [];
  private readonly registration = { callback: undefined as unknown as IntersectionObserverCallback, targets: this.targets };

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.registration.callback = callback;
    this.rootMargin = options.rootMargin ?? '0px';
    this.thresholds = Array.isArray(options.threshold) ? options.threshold : [options.threshold ?? 0];
    registerObserver(this.registration);
  }

  observe(target: Element): void {
    this.targets.push(target);
  }

  unobserve(target: Element): void {
    forgetObserver(this.registration);
    const index = this.targets.indexOf(target);
    if (index >= 0) this.targets.splice(index, 1);
  }

  disconnect(): void {
    unregisterObserver(this.registration);
    this.targets.length = 0;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (!('ResizeObserver' in globalThis)) {
  (globalThis as { ResizeObserver?: unknown }).ResizeObserver = NoopResizeObserver;
}
if (!('IntersectionObserver' in globalThis)) {
  (globalThis as { IntersectionObserver?: unknown }).IntersectionObserver = TestIntersectionObserver;
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => undefined;
}
