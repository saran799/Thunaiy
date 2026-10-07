import type { Translator } from '../../i18n';
import FigmaImg from '../../components/FigmaImg';
import type { FormFieldRect } from './types';

interface Props {
  field: FormFieldRect;
  requiredCount: number;
  doneCount: number;
  /** True while the progress change is being saved. */
  saving?: boolean;
  t: Translator;
  onClose: () => void;
  onToggleDone: (field: FormFieldRect) => void;
  onFinish: () => void;
}

/**
 * Field guidance sheet. The Figma file has no guidance panel, so this is the
 * smallest interaction consistent with the existing design language: a white
 * sheet using the existing radii, shadow-sheet, teal/cyan accents and the same
 * primary/secondary button treatments used on the Complete screen.
 */
export default function GuidanceSheet({
  field,
  requiredCount,
  doneCount,
  saving = false,
  t,
  onClose,
  onToggleDone,
  onFinish,
}: Props) {
  const done = field.progress === 'done';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={field.label}
      className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] rounded-t-[16px] bg-white px-[24px] pb-[24px] pt-[16px] shadow-sheet"
    >
      <div className="flex items-start justify-between gap-[12px]">
        <div className="min-w-0">
          <h2 className="text-[18px] font-semibold leading-[26px] tracking-[-0.18px] text-ink">{field.label}</h2>
          {field.guidance?.docLabel ? (
            <span className="mt-[6px] inline-flex items-center gap-[6px] rounded-full bg-cyan px-[8px] py-[2px] text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-teal-ink">
              <FigmaImg id="ee6a6" />
              {field.guidance.docLabel}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={t('viewer.sheetClose')}
          onClick={onClose}
          className="flex size-[40px] shrink-0 items-center justify-center rounded-full bg-surface"
        >
          <FigmaImg id="ff924" className="rotate-90" />
        </button>
      </div>

      {field.guidance?.body ? (
        <p className="pt-[12px] text-[14px] leading-[20px] tracking-[0.14px] text-muted">{field.guidance.body}</p>
      ) : null}

      <p className="pt-[12px] text-[12px] leading-[18px] tracking-[0.06px] text-subtle">
        {t('viewer.sheetProgress', { done: doneCount, total: requiredCount })}
      </p>

      <div className="flex flex-col gap-[12px] pt-[16px]">
        <button
          type="button"
          disabled={saving}
          onClick={() => onToggleDone(field)}
          className={`flex h-[52px] w-full items-center justify-center rounded-[12px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-white drop-shadow-card ${
            done ? 'bg-teal' : 'bg-navy'
          } ${saving ? 'opacity-75' : ''}`}
        >
          {done ? t('viewer.markedDone') : t('viewer.markDone')}
        </button>
        <button
          type="button"
          onClick={onFinish}
          className="flex h-[48px] w-full items-center justify-center rounded-[12px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-navy"
        >
          {t('viewer.finish')}
        </button>
      </div>
    </div>
  );
}
