import FigmaImg from './FigmaImg';
import { useTranslation } from '../i18n/I18nProvider';

export default function ProfileButton() {
  const { t } = useTranslation();
  return (
    <button type="button" aria-label={t('common.profile')} className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-deep">
      <FigmaImg id="59e02" />
    </button>
  );
}
