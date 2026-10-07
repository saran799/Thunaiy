import { useMemo, useState } from 'react';
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

const ALL_FILTER = '__all__';

export default function FormsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { selectBank, selectBankForm, resetSelection } = useAppState();
  const services = useServices();
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>(ALL_FILTER);

  const directory = useAsync(() => services.catalog.listDirectoryForms(), [services]);
  const forms = useMemo(() => directory.data ?? [], [directory.data]);

  const bankFilters = useMemo(() => {
    const names: string[] = [];
    for (const form of forms) if (!names.includes(form.bankName)) names.push(form.bankName);
    return names;
  }, [forms]);

  const visibleForms = useMemo(() => {
    const normalised = query.trim().toLowerCase();
    return forms.filter((form) => {
      if (activeFilter !== ALL_FILTER && form.bankName !== activeFilter) return false;
      if (normalised.length === 0) return true;
      const haystack = [
        form.bankName,
        t(form.titleKey as TranslationKey),
        t(form.descriptionKey as TranslationKey),
        ...form.purposeLabelKeys.map((key) => t(key as TranslationKey)),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalised);
    });
  }, [forms, activeFilter, query, t]);

  const openForm = (bankId: string, bankFormId: string) => {
    resetSelection();
    selectBank(bankId);
    selectBankForm(bankFormId);
    navigate('/purpose');
  };

  return (
    <Screen className="pb-[80px] pt-[56px]">
      <AppHeader variant="home" />
      <main className="flex flex-col gap-[16px] px-[24px] pb-[24px] pt-[4px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[4px]">
            <h1 className="text-[22px] font-semibold leading-[30px] tracking-[-0.33px] text-ink">{t('forms.title')}</h1>
            <span className="ml-[4px] rounded-full bg-cyan px-[8px] py-[2px] text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-teal-ink">
              {visibleForms.length}
            </span>
          </div>
          <button
            type="button"
            aria-label={t('forms.filterOptions')}
            onClick={() => setActiveFilter(ALL_FILTER)}
            className="flex size-[40px] items-center justify-center rounded-full"
          >
            <FigmaImg id="72470" />
          </button>
        </div>

        <div className="flex flex-col gap-[6px]">
          <div className="relative rounded-[8px] bg-white drop-shadow-card">
            <label htmlFor="forms-search" className="sr-only">
              {t('forms.searchLabel')}
            </label>
            <input
              id="forms-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('forms.searchPlaceholder')}
              className="h-[48px] w-full rounded-[8px] bg-transparent pl-[44px] pr-[40px] text-[14px] text-muted outline-none placeholder:text-muted"
            />
            <div className="pointer-events-none absolute left-[16.5px] top-[16.5px]">
              <FigmaImg id="0661e" />
            </div>
          </div>
          <p className="pl-[4px] text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">{t('forms.searchHint')}</p>
        </div>

        <div className="-mx-[24px] flex h-[44px] items-center gap-[8px] overflow-x-auto px-[24px]">
          {[{ id: ALL_FILTER, label: t('forms.filterAll') }, ...bankFilters.map((name) => ({ id: name, label: name }))].map(
            (filter) => {
              const on = filter.id === activeFilter;
              return (
                <button
                  key={filter.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex h-[36px] shrink-0 items-center justify-center rounded-full px-[16px] text-[12px] font-medium leading-[16px] tracking-[0.24px] ${
                    on ? 'bg-cyan text-teal-ink' : 'bg-white text-muted drop-shadow-card'
                  }`}
                >
                  {filter.label}
                </button>
              );
            },
          )}
        </div>

        <div className="flex items-center justify-between pt-[4px]">
          <h2 className="text-[16px] font-semibold leading-[24px] tracking-[-0.08px] text-ink">{t('forms.available')}</h2>
          <span className="text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">
            {t('forms.showing', { shown: visibleForms.length, total: forms.length })}
          </span>
        </div>

        {directory.loading ? <StatePanel variant="loading" title={t('common.loading')} /> : null}

        {directory.error ? (
          <StatePanel
            variant="error"
            title={t('common.errorTitle')}
            body={t(errorMessageKey(isApiError(directory.error) ? directory.error.code : undefined))}
            actionLabel={t('common.retry')}
            onAction={directory.reload}
          />
        ) : null}

        {!directory.loading && !directory.error && visibleForms.length === 0 ? (
          <StatePanel
            variant="empty"
            title={t('forms.emptyTitle')}
            body={t('forms.emptyBody')}
            actionLabel={t('common.retry')}
            onAction={() => {
              setQuery('');
              setActiveFilter(ALL_FILTER);
            }}
          />
        ) : null}

        {visibleForms.length > 0 ? (
          <ul className="flex flex-col gap-[10px]">
            {visibleForms.map((form) => (
              <li key={form.bankFormId}>
                <button
                  type="button"
                  onClick={() => openForm(form.bankId, form.bankFormId)}
                  aria-label={t('forms.openAria', { form: t(form.titleKey as TranslationKey), bank: form.bankName })}
                  className="flex w-full items-center gap-[16px] rounded-[12px] bg-white p-[14px] text-left drop-shadow-card"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-[14px]">
                    <div className="flex size-[44px] shrink-0 items-center justify-center rounded-[8px] bg-surface-2">
                      <FigmaImg id={form.icon} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="overflow-clip whitespace-nowrap text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">
                        {t(form.titleKey as TranslationKey)}
                      </h3>
                      <p className="whitespace-nowrap text-[11px] font-medium leading-[14px] tracking-[0.44px] text-teal">
                        {form.bankName}
                      </p>
                      {/* The description wraps to the width of the title/bank lines, as in Figma. */}
                      <div className="w-0 min-w-full pt-[2px]">
                        <p className="text-[12px] leading-[18px] tracking-[0.06px] text-muted">
                          {t(form.descriptionKey as TranslationKey)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full">
                    <FigmaImg id="9d29a" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="pt-[16px]">
          <div className="flex items-start gap-[12px] rounded-[12px] bg-surface p-[16px]">
            <FigmaImg id="f39b5" />
            <div className="min-w-0">
              <p className="whitespace-nowrap text-[12px] font-medium leading-[16px] tracking-[0.24px] text-ink">
                {t('forms.infoTitle')}
              </p>
              <div className="w-0 min-w-full pt-[2px]">
                <p className="text-[12px] leading-[18px] tracking-[0.06px] text-muted">{t('forms.infoBody')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </Screen>
  );
}
