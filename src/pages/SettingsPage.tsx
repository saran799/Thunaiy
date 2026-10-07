import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import FigmaImg from '../components/FigmaImg';
import type { FigmaAssetId } from '../assets/figmaAssets';
import { useTranslation } from '../i18n/I18nProvider';
import { languageOption } from '../domain/languages';
import { useAppState } from '../state/AppStateContext';
import { useServices } from '../services/ServicesProvider';
import { formatIndianPhone } from '../state/otpChallenge';

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="px-[4px] text-[11px] font-semibold uppercase leading-[14px] tracking-[0.55px] text-muted">{children}</h2>;
}

function IconBox({ icon, className = 'bg-surface-2' }: { icon: FigmaAssetId; className?: string }) {
  return (
    <div className={`flex size-[32px] shrink-0 items-center justify-center rounded-[8px] ${className}`}>
      <FigmaImg id={icon} />
    </div>
  );
}

/** Settings row. Rows without `onClick` are intentionally non-navigating (matches Figma: no destination screens exist). */
function Row({ icon, label, onClick, trailing }: { icon: FigmaAssetId; label: string; onClick?: () => void; trailing?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[48px] w-full items-center justify-between p-[16px] text-left">
      <div className="flex items-center gap-[14px]">
        <IconBox icon={icon} />
        <span className="text-[16px] font-medium leading-[24px] text-ink">{label}</span>
      </div>
      {trailing ?? <FigmaImg id="9d29a" />}
    </button>
  );
}

const Divider = () => (
  <div className="h-px px-[16px]">
    <div className="h-px bg-surface-3" />
  </div>
);

export default function SettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, setShowFieldGuidance, signOut } = useAppState();
  const services = useServices();

  const session = state.session;
  const guidanceOn = state.preferences.showFieldGuidance;
  const language = languageOption(state.preferences.languageCode);

  const toggleGuidance = () => {
    const next = !guidanceOn;
    setShowFieldGuidance(next);
    if (session) {
      void services.preferences.update(session.token, { showFieldGuidance: next }).catch(() => undefined);
    }
  };

  const handleLogout = async () => {
    if (session) {
      // Server-side invalidation first, then clear local session state.
      await services.auth.logout(session.token).catch(() => undefined);
    }
    signOut();
    navigate('/register');
  };

  return (
    <Screen className="pb-[80px] pt-[56px]">
      <AppHeader variant="settings" />
      <main className="px-[24px] py-[16px]">
        <div className="flex items-center justify-between rounded-[12px] bg-white p-[16px] drop-shadow-card">
          <div className="flex items-center gap-[12px]">
            <div className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-surface">
              <FigmaImg id="dec7f" />
            </div>
            <div>
              <p className="text-[17px] font-semibold leading-[23.38px] text-ink">{session?.user.name ?? ''}</p>
              <p className="text-[14px] leading-[20px] text-muted">
                {session ? formatIndianPhone(session.user.phoneE164) : ''}
              </p>
            </div>
          </div>
          <button type="button" className="flex items-center gap-[2px] text-[13px] leading-[19.5px] text-teal">
            <span>{t('settings.editProfile')}</span>
            <FigmaImg id="e4403" />
          </button>
        </div>

        <section className="flex flex-col gap-[8px] pt-[24px]">
          <SectionTitle>{t('settings.preferences')}</SectionTitle>
          <div className="overflow-clip rounded-[12px] bg-white shadow-field">
            <Row
              icon="15326"
              label={t('settings.language')}
              onClick={() => navigate('/language?from=settings')}
              trailing={
                <div className="flex items-center gap-[4px]">
                  <span className="text-[14px] leading-[20px] text-muted">{language.label}</span>
                  <FigmaImg id="9d29a" />
                </div>
              }
            />
          </div>
        </section>

        <section className="flex flex-col gap-[8px] pt-[24px]">
          <SectionTitle>{t('settings.formExperience')}</SectionTitle>
          <div className="flex items-start justify-between rounded-[12px] bg-white p-[16px] drop-shadow-card">
            <div className="flex items-start gap-[14px]">
              <div className="flex h-[34px] w-[32px] shrink-0 flex-col pt-[2px]">
                <IconBox icon="c5ade" />
              </div>
              <div className="pr-[4px]">
                <p className="whitespace-nowrap text-[16px] font-medium leading-[22px] text-ink">{t('settings.guidance')}</p>
                {/* Description wraps to the width of the title, as in Figma. */}
                <div className="w-0 min-w-full pt-[2px]">
                  <p className="text-[12px] leading-[18px] tracking-[0.06px] text-muted">{t('settings.guidanceBody')}</p>
                </div>
              </div>
            </div>
            <div className="pt-[4px]">
              <button
                type="button"
                role="switch"
                aria-checked={guidanceOn}
                aria-label={t('settings.guidance')}
                onClick={toggleGuidance}
                className="relative flex items-center"
              >
                <div className={`h-[28px] w-[48px] rounded-full ${guidanceOn ? 'bg-teal' : 'bg-track'}`} />
                <div
                  className={`absolute top-[4px] size-[20px] rounded-full bg-white shadow-knob transition-[left] ${
                    guidanceOn ? 'left-[24px]' : 'left-[4px]'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-[8px] pt-[24px]">
          <SectionTitle>{t('settings.support')}</SectionTitle>
          <div className="overflow-clip rounded-[12px] bg-white shadow-field">
            <Row icon="cf99d" label={t('settings.help')} />
            <Divider />
            <Row icon="e9313" label={t('settings.privacy')} />
            <Divider />
            <Row icon="0c5af" label={t('settings.terms')} />
          </div>
        </section>

        <section className="flex flex-col gap-[8px] pt-[24px]">
          <SectionTitle>{t('settings.about')}</SectionTitle>
          <div className="overflow-clip rounded-[12px] bg-white shadow-field">
            <Row icon="52f7b" label={t('settings.aboutThunaiy')} />
          </div>
          <p className="pb-[1.5px] pt-[8.5px] text-center text-[12px] leading-[18px] tracking-[0.06px] text-outline-2">
            {t('app.version')}
          </p>
        </section>

        <div className="pt-[32px]">
          <div className="overflow-clip rounded-[12px] bg-white shadow-field">
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[48px] w-full items-center gap-[14px] p-[16px] text-left"
            >
              <IconBox icon="108d9" className="bg-[rgba(255,218,214,0.3)]" />
              <span className="text-[16px] font-medium leading-[24px] text-danger">{t('settings.logout')}</span>
            </button>
          </div>
        </div>
      </main>
      <BottomNav variant="settings" />
    </Screen>
  );
}
