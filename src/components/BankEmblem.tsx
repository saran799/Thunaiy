import { useState } from 'react';
import FigmaImg from './FigmaImg';
import type { FigmaAssetId } from '../assets/figmaAssets';

interface Props {
  emblem: FigmaAssetId | null;
  name: string;
}

/**
 * Bank emblem slot. Renders official emblem from assets or Figma registry;
 * banks whose emblem is unavailable fall back to a styled monogram tile so the slot
 * keeps its exact size and the grid never shifts.
 */
export default function BankEmblem({ emblem, name }: Props) {
  const [imgError, setImgError] = useState(false);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();

  const monogram = (
    <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-surface-2 text-[12px] font-semibold leading-[16px] tracking-[0.24px] text-teal-ink shadow-xs">
      {initials}
    </span>
  );

  if (!emblem || imgError) {
    return monogram;
  }

  // Check if bank has a specific PNG
  const bankPngMap: Record<string, string> = {
    '8fbcd': 'sbi.png',
    '1c19e': 'hdfc.png',
    '44085': 'canara.png',
    '6f05a': 'icici.png',
  };

  const pngName = bankPngMap[emblem];

  if (pngName) {
    return (
      <img
        src={`${import.meta.env.BASE_URL}assets/banks/${pngName}`}
        alt={name}
        className="size-[32px] shrink-0 rounded-full object-contain"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="flex size-[32px] shrink-0 items-center justify-center">
      <FigmaImg id={emblem} alt={name} />
    </div>
  );
}

