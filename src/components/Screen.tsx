import type { ReactNode } from 'react';

/**
 * Mobile shell. The active language's font family is applied to <body> by
 * I18nProvider, so the shell must not hard-code a font utility here.
 */
export default function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-bg ${className}`}>
      {children}
    </div>
  );
}
