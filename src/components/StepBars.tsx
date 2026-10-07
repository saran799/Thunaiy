/** Segmented progress bars used in the onboarding header (navy = done, track = remaining). */
export default function StepBars({ filled, total = 4, barClass }: { filled: number; total?: number; barClass: string }) {
  return (
    <div className="flex items-center gap-[4px]" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`rounded-full ${barClass} ${i < filled ? 'bg-navy' : 'bg-track'}`} />
      ))}
    </div>
  );
}
