import FigmaImg from './FigmaImg';
import type { FigmaAssetId } from '../assets/figmaAssets';

/**
 * Bank emblem slot. Emblems come from the exported Figma assets; banks whose
 * emblem has not been exported yet fall back to a monogram tile so the slot
 * keeps its exact size and the grid does not shift.
 */
export default function BankEmblem({ emblem, name }: { emblem: FigmaAssetId | null; name: string }) {
  if (emblem) return <FigmaImg id={emblem} />;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return (
    <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-surface-2 text-[12px] font-semibold leading-[16px] tracking-[0.24px] text-teal-ink">
      {initials}
    </span>
  );
}
