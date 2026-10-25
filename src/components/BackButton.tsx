import { useNavigate } from 'react-router-dom';
import FigmaImg from './FigmaImg';
import type { FigmaAssetId } from '../assets/figmaAssets';
import { useTranslation } from '../i18n/I18nProvider';

interface Props {
  to?: string;
  icon?: FigmaAssetId;
  onClick?: () => void;
  className?: string;
}

/**
 * Accessible, consistent Back button used throughout the customer journey.
 * Supports keyboard focus, accessible label, and safe route fallback.
 */
export default function BackButton({
  to,
  icon = 'fe25d',
  onClick,
  className = '',
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (to) {
      navigate(to);
    } else if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/home');
    }
  };

  return (
    <button
      type="button"
      aria-label={t('common.back')}
      onClick={handleBack}
      className={`group relative flex size-[40px] shrink-0 items-center justify-center rounded-full text-deep transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal active:scale-95 ${className}`}
    >
      <span className="flex size-[32px] items-center justify-center">
        <FigmaImg id={icon} />
      </span>
    </button>
  );
}
