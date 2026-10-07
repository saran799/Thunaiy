import type { ReactNode } from 'react';

export default function Screen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col bg-bg font-sans ${className}`}>
      {children}
    </div>
  );
}
