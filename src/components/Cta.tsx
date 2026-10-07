import type { ReactNode } from 'react';
import FigmaImg from './FigmaImg';
import type { FigmaAssetId } from '../assets/figmaAssets';

interface Props {
  children: ReactNode;
  icon?: FigmaAssetId;
  onClick?: () => void;
  /** Complete Tailwind classes for size, color, radius, shadow and text style (from Figma). */
  className: string;
  iconClassName?: string;
}

export default function Cta({ children, icon, onClick, className, iconClassName = '' }: Props) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center justify-center ${className}`}>
      <span>{children}</span>
      {icon && <FigmaImg id={icon} className={iconClassName} />}
    </button>
  );
}
