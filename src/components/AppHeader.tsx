import { useNavigate } from 'react-router-dom';
import FigmaImg from './FigmaImg';
import ProfileButton from './ProfileButton';
import { useTranslation } from '../i18n/I18nProvider';

/** Thunaiy branding slot with circular icon + brand name */
function LogoSlot() {
  return (
    <div className="flex items-center gap-[8px]">
      <img
        src={`${import.meta.env.BASE_URL}assets/thunaiy-logo.jpg`}
        alt=""
        aria-hidden="true"
        className="size-[32px] rounded-full object-cover shrink-0 shadow-sm"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
      <span className="text-[18px] font-semibold leading-[24px] tracking-tight text-deep">
        Thunaiy
      </span>
    </div>
  );
}

/** Top bar for Home, Forms (variant "home") and Settings (variant "settings"). */
export default function AppHeader({ variant }: { variant: 'home' | 'settings' }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const bg = variant === 'home' ? 'bg-[rgba(247,249,255,0.85)]' : 'bg-[rgba(255,255,255,0.85)]';
  return (
    <header className={`fixed inset-x-0 top-0 z-20 mx-auto w-full max-w-[430px] shadow-header backdrop-blur-[12px] ${bg}`}>
      <div className="flex h-[56px] items-center justify-between px-[16px]">
        {variant === 'home' ? (
          <div className="flex min-w-0 items-center gap-[8px]">
            <LogoSlot />
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-[6px]">
            <button
              type="button"
              aria-label={t('common.back')}
              onClick={() => navigate('/home')}
              className="flex size-[40px] items-center justify-center rounded-[8px] text-ink hover:bg-surface-2 transition-colors"
            >
              <FigmaImg id="271b7" />
            </button>
            <h1 className="overflow-hidden text-ellipsis whitespace-nowrap text-[18px] font-semibold leading-[26px] tracking-[-0.18px] text-ink">
              {t('settings.title')}
            </h1>
          </div>
        )}
        <ProfileButton />
      </div>
    </header>
  );
}

