import { NavLink } from 'react-router-dom';
import FigmaImg from './FigmaImg';
import type { FigmaAssetId } from '../assets/figmaAssets';
import { useTranslation } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';

type Tab = 'home' | 'forms' | 'settings';

const ICONS: Record<Tab, { active: FigmaAssetId; inactive: FigmaAssetId }> = {
  home: { active: '14a3f', inactive: '141f1' },
  forms: { active: 'c3545', inactive: 'c3545' },
  settings: { active: 'c50fe', inactive: '17005' },
};

const TABS: { tab: Tab; to: string; labelKey: TranslationKey }[] = [
  { tab: 'home', to: '/home', labelKey: 'nav.home' },
  { tab: 'forms', to: '/forms', labelKey: 'nav.forms' },
  { tab: 'settings', to: '/settings', labelKey: 'nav.settings' },
];

/** Bottom navigation. Settings uses a slightly different Figma treatment (variant "settings"). */
export default function BottomNav({ variant = 'home' }: { variant?: 'home' | 'settings' }) {
  const { t } = useTranslation();
  const isSettings = variant === 'settings';
  return (
    <nav
      aria-label={t('nav.primary')}
      className={`fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[430px] backdrop-blur-[12px] ${
        isSettings ? 'bg-[rgba(255,255,255,0.85)] shadow-nav-settings' : 'bg-[rgba(247,249,255,0.85)] shadow-nav'
      }`}
    >
      <div className="flex h-[64px] items-center justify-around px-[12px]">
        {TABS.map(({ tab, to, labelKey }) => (
          <NavLink
            key={tab}
            to={to}
            className={({ isActive }) =>
              `flex min-h-[44px] flex-col items-center justify-center ${
                isSettings ? 'min-w-[64px] px-[8px] py-[4px]' : 'min-w-[56px] gap-[4px] px-[4px] py-px'
              } ${isActive ? 'text-teal' : 'text-muted'}`
            }
          >
            {({ isActive }) => (
              <>
                <FigmaImg id={isActive ? ICONS[tab].active : ICONS[tab].inactive} />
                <span className={`text-[11px] font-semibold leading-[14px] tracking-[0.44px] ${isSettings ? 'pt-[2px]' : ''}`}>
                  {t(labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
