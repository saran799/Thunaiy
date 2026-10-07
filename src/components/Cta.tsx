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
  /** Defaults to a plain button; use "submit" inside a form. */
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export default function Cta({ children, icon, onClick, className, iconClassName = '', type = 'button', disabled }: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-center ${className}`}
    >
      <span>{children}</span>
      {icon && <FigmaImg id={icon} className={iconClassName} />}
    </button>
  );
}
