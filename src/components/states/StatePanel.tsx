import FigmaImg from '../FigmaImg';
import type { FigmaAssetId } from '../../assets/figmaAssets';

export type StatePanelVariant = 'loading' | 'error' | 'empty' | 'unavailable';

interface Props {
  variant: StatePanelVariant;
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: FigmaAssetId;
}

/**
 * Loading / empty / error / unavailable panel. The Figma baseline has no such
 * screens, so these reuse the existing surface card, radius, typography and
 * button treatments so they sit inside the approved visual language.
 */
export default function StatePanel({ variant, title, body, actionLabel, onAction, icon = '9e00f' }: Props) {
  return (
    <div className="flex flex-col items-center px-[24px] py-[32px] text-center" role="status">
      {variant === 'loading' ? (
        <span
          aria-hidden="true"
          className="size-[24px] animate-spin rounded-full border-2 border-track border-t-teal"
        />
      ) : (
        <span className="flex size-[40px] items-center justify-center rounded-[8px] bg-surface">
          <FigmaImg id={icon} />
        </span>
      )}
      <p className="pt-[16px] text-[16px] font-semibold leading-[24px] tracking-[-0.08px] text-ink">{title}</p>
      {body ? <p className="pt-[4px] text-[12px] leading-[18px] tracking-[0.06px] text-muted">{body}</p> : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-[16px] flex min-h-[44px] items-center justify-center rounded-[12px] bg-teal px-[20px] text-[14px] font-semibold leading-[20px] text-white drop-shadow-card"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
