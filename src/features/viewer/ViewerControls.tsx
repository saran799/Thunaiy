import FigmaImg from '../../components/FigmaImg';
import type { Translator } from '../../i18n';

interface Props {
  /** Rounded zoom percentage, e.g. 100. */
  percent: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  t: Translator;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

/** Floating zoom pill. Appearance is unchanged from the Figma baseline; the controls are now wired. */
export default function ViewerControls({ percent, canZoomIn, canZoomOut, t, onZoomIn, onZoomOut, onFit }: Props) {
  return (
    <div className="fixed inset-x-0 bottom-[16.25px] z-10 mx-auto flex w-full max-w-[430px] items-center justify-center px-[12px]">
      <div className="relative flex items-center gap-[8px] rounded-full bg-deep px-[16px] py-[6px] shadow-controls backdrop-blur-[8px]">
        <button
          type="button"
          aria-label={t('viewer.zoomOut')}
          disabled={!canZoomOut}
          onClick={onZoomOut}
          className="flex size-[32px] items-center justify-center rounded-full"
        >
          <FigmaImg id="77258" />
        </button>
        <span className="w-[44px] text-center font-mono text-[11px] leading-[14px] tracking-[-0.275px] text-white">
          {t('viewer.zoomLevel', { percent })}
        </span>
        <button
          type="button"
          aria-label={t('viewer.zoomIn')}
          disabled={!canZoomIn}
          onClick={onZoomIn}
          className="flex size-[32px] items-center justify-center rounded-full"
        >
          <FigmaImg id="b8dbe" />
        </button>
        <div className="flex h-[4px] w-[8px] flex-col px-[2px]" aria-hidden="true">
          <div className="size-[4px] rounded-full bg-[rgba(255,255,255,0.3)]" />
        </div>
        <button
          type="button"
          aria-label={t('viewer.resetScale')}
          onClick={onFit}
          className="flex items-center gap-[4px] rounded-full px-[8px] py-[4px]"
        >
          <FigmaImg id="64a22" />
          <span className="text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-white">{t('viewer.fit')}</span>
        </button>
      </div>
    </div>
  );
}
