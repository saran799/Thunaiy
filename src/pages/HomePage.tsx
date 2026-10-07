import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import FigmaImg from '../components/FigmaImg';
import StatePanel from '../components/states/StatePanel';
import { useTranslation } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';
import { useAppState } from '../state/AppStateContext';
import { useServices } from '../services/ServicesProvider';
import { useAsync } from '../hooks/useAsync';
import { isApiError } from '../services/errors';
import { errorMessageKey } from '../services/errorMessages';
import type { SavedFormSummary } from '../domain/types';

const RECENT_LIMIT = 5;

export default function HomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, openSavedForm } = useAppState();
  const services = useServices();

  const token = state.session?.token ?? '';
  const recent = useAsync(() => services.savedForms.listSummaries(token, RECENT_LIMIT), [services, token]);
  const recents = recent.data ?? [];

  const openForm = (form: SavedFormSummary) => {
    openSavedForm({
      savedFormId: form.id,
      bankId: form.bankId,
      bankFormId: form.bankFormId,
      purposeId: form.purposeId,
      formVersionId: form.formVersionId,
    });
    navigate('/viewer');
  };

  return (
    <Screen className="pb-[80px] pt-[56px]">
      <AppHeader variant="home" />
      <main className="px-[24px] pb-[24px]">
        <div className="pt-[24px]">
          <p className="text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-muted">{t('home.welcome')}</p>
          <h1 className="pt-[4px] text-[22px] font-semibold leading-[30px] tracking-[-0.55px] text-ink">{t('home.question')}</h1>
        </div>

        <div className="pt-[20px]">
          <button
            type="button"
            onClick={() => navigate('/bank')}
            className="flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-teal text-[14px] font-semibold leading-[20px] text-white drop-shadow-card"
          >
            <span>{t('home.findForm')}</span>
            <FigmaImg id="77060" />
          </button>
        </div>

        {recent.loading ? <StatePanel variant="loading" title={t('common.loading')} /> : null}

        {recent.error ? (
          <StatePanel
            variant="error"
            title={t('common.errorTitle')}
            body={t(errorMessageKey(isApiError(recent.error) ? recent.error.code : undefined))}
            actionLabel={t('common.retry')}
            onAction={recent.reload}
          />
        ) : null}

        {!recent.loading && !recent.error && recents.length > 0 ? (
          <section className="pt-[32px]">
            <div className="flex items-center justify-between">
              <h2 className="text-[18px] font-semibold leading-[26px] tracking-[-0.18px] text-ink">{t('home.recent')}</h2>
              <button
                type="button"
                onClick={() => navigate('/forms')}
                className="py-[4px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-teal"
              >
                {t('home.seeAll')}
              </button>
            </div>
            <ul className="flex flex-col gap-[8px] pt-[16px]">
              {recents.map((form) => (
                <li key={form.id}>
                  <button
                    type="button"
                    onClick={() => openForm(form)}
                    aria-label={t('home.openAria', { form: t(form.formTitleKey as TranslationKey), bank: form.bankName })}
                    className="flex w-full items-center gap-[16px] rounded-[12px] bg-white p-[16px] text-left drop-shadow-card"
                  >
                    <div className="flex size-[48px] shrink-0 items-center justify-center rounded-[12px] bg-surface-2">
                      <FigmaImg id={form.icon} />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                      <h3 className="overflow-clip text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">
                        {t(form.formTitleKey as TranslationKey)}
                      </h3>
                      <p className="overflow-clip pt-[2px] text-[12px] leading-[18px] tracking-[0.06px] text-muted">
                        {form.bankName}
                      </p>
                      <div className="flex items-center pt-[4px]">
                        {form.status === 'completed' ? (
                          <span className="flex items-center rounded-full bg-cyan px-[8px] py-[2px] text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-teal-dark">
                            {t('home.statusCompleted')}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">
                            {t('home.statusViewed')}
                          </span>
                        )}
                      </div>
                    </div>
                    <FigmaImg id="a9ff4" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {!recent.loading && !recent.error && recents.length === 0 ? (
          <div className="pt-[32px]">
            <div className="flex items-start gap-[16px] rounded-[12px] bg-surface p-[16px]">
              <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-track">
                <FigmaImg id="9e00f" />
              </div>
              <div className="pt-[2px]">
                <p className="text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">{t('home.emptyTitle')}</p>
                <p className="pt-[2px] text-[12px] leading-[18px] tracking-[0.06px] text-muted">{t('home.emptyBody')}</p>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <BottomNav />
    </Screen>
  );
}
