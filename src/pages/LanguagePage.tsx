import { useNavigate, useSearchParams } from 'react-router-dom';
import Screen from '../components/Screen';
import BackButton from '../components/BackButton';
import Cta from '../components/Cta';
import StepBars from '../components/StepBars';
import { useTranslation } from '../i18n/I18nProvider';
import { LANGUAGES } from '../domain/languages';
import { useAppState } from '../state/AppStateContext';
import { useServices } from '../services/ServicesProvider';

export default function LanguagePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { state, setLanguage } = useAppState();
  const services = useServices();

  // Opened from Settings as a preference rather than as onboarding step 1 of 4.
  const fromSettings = searchParams.get('from') === 'settings';
  const selected = state.preferences.languageCode;

  const choose = (languageCode: (typeof LANGUAGES)[number]['id']) => {
    // Applied immediately so the whole app switches language as you tap.
    setLanguage(languageCode);
    const token = state.session?.token;
    if (token) {
      void services.preferences.update(token, { languageCode }).catch(() => undefined);
    }
  };

  return (
    <Screen>
      <header className="flex items-center justify-between px-[24px] pb-[16px] pt-[8px]">
        <BackButton to={fromSettings ? '/settings' : '/otp'} icon="8b04a" />
        <div className="flex items-center gap-[8px]">
          <span className="text-[12px] font-medium leading-[16px] tracking-[0.24px] text-muted">{t('language.step')}</span>
          <StepBars filled={1} barClass="h-[4px] w-[24px]" />
        </div>
      </header>
      <main className="px-[24px] pb-[24px]">
        <div className="flex flex-col gap-[8px] pb-[32px] pt-[16px]">
          <h1 className="text-[26px] font-semibold leading-[34px] tracking-[-0.65px] text-ink">{t('language.title')}</h1>
          <p className="text-[16px] leading-[24px] tracking-[-0.08px] text-muted">{t('language.subtitle')}</p>
        </div>
        <div role="radiogroup" aria-label={t('language.radioLabel')} className="flex flex-col gap-[12px]">
          {LANGUAGES.map((language) => {
            const on = language.id === selected;
            return (
              <button
                key={language.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => choose(language.id)}
                className={`flex h-[58px] w-full items-center justify-between rounded-[12px] px-[18px] drop-shadow-card ${on ? 'bg-surface' : 'bg-white'}`}
              >
                <span className={`text-[16px] leading-[24px] tracking-[-0.4px] text-ink ${language.fontClass}`}>{language.label}</span>
                <span className={`flex size-[22px] items-center justify-center rounded-full ${on ? 'bg-cyan' : 'bg-track'}`}>
                  {on && <span className="size-[10px] rounded-full bg-teal" />}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-center pt-[40px]">
          <Cta
            icon="03d99"
            onClick={() => navigate(fromSettings ? '/settings' : '/bank')}
            className="h-[54px] gap-[8px] rounded-[14px] bg-navy text-[14px] font-semibold leading-[20px] tracking-[0.35px] text-white shadow-cta"
          >
            {t('language.continue')}
          </Cta>
          <p className="pt-[12px] text-center text-[12px] leading-[18px] tracking-[0.06px] text-muted">{t('language.footer')}</p>
        </div>
      </main>
    </Screen>
  );
}
