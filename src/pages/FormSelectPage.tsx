import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import BackButton from '../components/BackButton';
import Cta from '../components/Cta';
import FigmaImg from '../components/FigmaImg';
import StepBars from '../components/StepBars';
import BankEmblem from '../components/BankEmblem';
import StatePanel from '../components/states/StatePanel';
import { useTranslation } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n';
import { useAppState } from '../state/AppStateContext';
import { useServices } from '../services/ServicesProvider';
import { useAsync } from '../hooks/useAsync';
import { isApiError } from '../services/errors';
import { errorMessageKey } from '../services/errorMessages';

export default function FormSelectPage({
  nextRoute = '/purpose',
  backRoute = '/bank',
  errorRoute = '/bank',
}: {
  nextRoute?: string;
  backRoute?: string;
  errorRoute?: string;
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, selectBankForm } = useAppState();
  const services = useServices();
  const [query, setQuery] = useState('');

  const bankId = state.selections.bankId;
  const bankFormId = state.selections.bankFormId;

  const data = useAsync(async () => {
    if (!bankId) return null;
    const [bank, forms] = await Promise.all([
      services.catalog.getBank(bankId),
      services.catalog.listBankForms(bankId),
    ]);
    return { bank, forms };
  }, [services, bankId]);

  const forms = useMemo(() => data.data?.forms ?? [], [data.data]);

  const visibleForms = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    if (normalised.length === 0) return forms;
    return forms.filter((form) => {
      const title = t(form.titleKey as TranslationKey).toLowerCase();
      const description = t(form.descriptionKey as TranslationKey).toLowerCase();
      return title.includes(normalised) || description.includes(normalised);
    });
  }, [forms, query, t]);

  useEffect(() => {
    if (bankFormId || forms.length === 0) return;
    selectBankForm(forms[0].bankFormId);
  }, [bankFormId, forms, selectBankForm]);

  const handleContinue = async () => {
    if (!bankFormId) return;
    const purposes = await services.catalog.listPurposes(bankFormId);
    if (purposes.length > 0) {
      navigate(nextRoute);
    } else {
      const viewerBase = nextRoute.startsWith('/assist') ? `${nextRoute.replace(/\/purpose$/, '')}/viewer` : '/viewer';
      navigate(`${viewerBase}?mode=pdf`);
    }
  };

  const handleOpenPdf = (e: React.MouseEvent, formId: string) => {
    e.stopPropagation();
    selectBankForm(formId);
    const viewerBase = nextRoute.startsWith('/assist') ? `${nextRoute.replace(/\/purpose$/, '')}/viewer` : '/viewer';
    navigate(`${viewerBase}?mode=pdf`);
  };

  if (!bankId) return <Navigate to={errorRoute} replace />;

  return (
    <Screen className="pb-[24px]">
      <header className="flex items-center justify-between pb-[16px] pl-[24px] pr-[23.99px] pt-[8px]">
        <BackButton to={backRoute} icon="fe25d" />
        <div className="flex items-center gap-[11.99px]">
          <span className="text-[12px] font-medium leading-[16px] tracking-[0.24px] text-muted">{t('formSelect.step')}</span>
          <StepBars filled={3} barClass="h-[6px] w-[20px]" />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="px-[24px] pb-[20px] pt-[8px]">
          <h1 className="text-[26px] font-semibold leading-[34px] tracking-[-0.65px] text-ink">{t('formSelect.title')}</h1>
          <p className="pt-[4px] text-[16px] leading-[24px] tracking-[-0.08px] text-muted">{t('formSelect.subtitle')}</p>
        </div>

        <div className="px-[24px] pb-[16px]">
          <div className="flex h-[52px] items-center justify-between rounded-[12px] bg-white px-[16px] drop-shadow-card">
            <div className="flex min-w-0 items-center gap-[12px]">
              <div className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-sbi-badge">
                <BankEmblem emblem={data.data?.bank?.emblem ?? null} name={data.data?.bank?.name ?? ''} />
              </div>
              <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium leading-[20px] tracking-[0.14px] text-ink">
                {data.data?.bank?.name ?? ''}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate(backRoute)}
              className="text-[14px] font-medium leading-[20px] tracking-[0.14px] text-teal"
            >
              {t('common.change')}
            </button>
          </div>
        </div>

        <div className="px-[24px] pb-[24px]">
          <div className="flex h-[52px] items-center rounded-[12px] bg-white drop-shadow-card">
            <FigmaImg id="09ce4" />
            <label htmlFor="form-search" className="sr-only">
              {t('formSelect.searchLabel')}
            </label>
            <input
              id="form-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('formSelect.searchPlaceholder')}
              className="h-full min-w-0 flex-1 bg-transparent px-[12px] text-[16px] tracking-[-0.08px] text-muted outline-none placeholder:text-muted"
            />
          </div>
        </div>

        {data.loading ? <StatePanel variant="loading" title={t('common.loading')} /> : null}

        {data.error ? (
          <StatePanel
            variant="error"
            title={t('common.errorTitle')}
            body={t(errorMessageKey(isApiError(data.error) ? data.error.code : undefined))}
            actionLabel={t('common.retry')}
            onAction={data.reload}
          />
        ) : null}

        {!data.loading && !data.error && visibleForms.length === 0 ? (
          <StatePanel variant="empty" title={t('formSelect.empty')} body={t('bank.emptyBody')} />
        ) : null}

        {visibleForms.length > 0 ? (
          <section className="px-[24px]">
            <div className="flex items-center justify-between pb-[12px]">
              <h2 className="text-[12px] font-semibold uppercase leading-[16px] tracking-[0.6px] text-muted">
                {t('formSelect.section')}
              </h2>
              <span className="text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">
                {t('formSelect.available', { count: visibleForms.length })}
              </span>
            </div>
            <div role="radiogroup" aria-label={t('formSelect.listLabel')} className="flex flex-col gap-[10px]">
              {visibleForms.map((form) => {
                const on = form.bankFormId === bankFormId;
                return (
                  <button
                    key={form.bankFormId}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => selectBankForm(form.bankFormId)}
                    className={`flex min-h-[72px] w-full items-center justify-between rounded-[12px] p-[16px] text-left drop-shadow-card ${on ? 'bg-surface' : 'bg-white'}`}
                  >
                    <div className="flex min-w-0 items-center gap-[14px] pr-[8px]">
                      <div className={`flex size-[36px] shrink-0 items-center justify-center rounded-[8px] ${on ? 'bg-cyan' : 'bg-surface-2'}`}>
                        <FigmaImg id={form.icon} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-[6px]">
                          <p className="overflow-clip whitespace-nowrap text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">
                            {t(form.titleKey as TranslationKey)}
                          </p>
                          {form.pdfUrl && (
                            <span className="rounded bg-teal/10 px-[5px] py-[1px] text-[10px] font-semibold tracking-wider text-teal">
                              PDF
                            </span>
                          )}
                        </div>
                        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-[18px] tracking-[0.06px] text-muted">
                          {t(form.descriptionKey as TranslationKey)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-[8px] shrink-0">
                      {form.pdfUrl && (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label={`${t('formSelect.viewPdf')}: ${t(form.titleKey as TranslationKey)}`}
                          onClick={(e) => handleOpenPdf(e, form.bankFormId)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              handleOpenPdf(e as any, form.bankFormId);
                            }
                          }}
                          className="flex h-[28px] items-center rounded-full bg-teal/10 px-[10px] text-[11px] font-semibold text-teal hover:bg-teal/20 transition-colors cursor-pointer"
                        >
                          {t('formSelect.viewPdf')}
                        </span>
                      )}
                      {on ? (
                        <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-navy">
                          <FigmaImg id="09465" />
                        </span>
                      ) : (
                        <FigmaImg id="9d29a" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        <div className="mt-auto px-[24px] pb-[8px] pt-[32px]">
          <Cta
            icon="03d99"
            disabled={!bankFormId}
            onClick={handleContinue}
            className="h-[54px] gap-[8px] rounded-[14px] bg-navy text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-white shadow-cta"
          >
            {t('common.continue')}
          </Cta>
        </div>
      </main>
    </Screen>
  );
}
