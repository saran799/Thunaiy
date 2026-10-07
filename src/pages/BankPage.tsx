import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import BackButton from '../components/BackButton';
import Cta from '../components/Cta';
import FigmaImg from '../components/FigmaImg';
import StepBars from '../components/StepBars';
import BankEmblem from '../components/BankEmblem';
import StatePanel from '../components/states/StatePanel';
import { useTranslation } from '../i18n/I18nProvider';
import { useAppState } from '../state/AppStateContext';
import { useServices } from '../services/ServicesProvider';
import { useAsync } from '../hooks/useAsync';
import { isApiError } from '../services/errors';
import { errorMessageKey } from '../services/errorMessages';

export default function BankPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { state, selectBank } = useAppState();
  const services = useServices();
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const banks = useAsync(() => services.catalog.listBanks(), [services]);
  const allBanks = useMemo(() => banks.data ?? [], [banks.data]);

  const visibleBanks = useMemo(() => {
    const base = showAll ? allBanks : allBanks.filter((bank) => bank.popular);
    const normalised = query.trim().toLowerCase();
    if (normalised.length === 0) return base;
    return base.filter((bank) => bank.name.toLowerCase().includes(normalised));
  }, [allBanks, showAll, query]);

  const selectedId = state.selections.bankId;
  const hasMoreBanks = allBanks.some((bank) => !bank.popular);

  // The Figma baseline shows the first popular bank selected; keep that as the
  // default until the user picks another one.
  useEffect(() => {
    if (selectedId || allBanks.length === 0) return;
    const fallback = allBanks.find((bank) => bank.popular) ?? allBanks[0];
    if (fallback) selectBank(fallback.id);
  }, [selectedId, allBanks, selectBank]);

  return (
    <Screen>
      <main className="flex flex-1 flex-col px-[24px] pb-[24px]">
        <div className="flex h-[64px] items-start pb-[16px] pt-[8px]">
          <div className="flex h-[40px] w-full items-center justify-between">
            <BackButton to="/language" icon="fe25d" />
            <div className="flex flex-col items-end gap-[6px]">
              <span className="text-[11px] font-medium leading-[14px] tracking-[0.44px] text-muted">{t('bank.step')}</span>
              <div className="w-[96px]">
                <StepBars filled={2} barClass="h-[6px] min-w-px flex-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[4px] pb-[24px]">
          <h1 className="text-[26px] font-semibold leading-[34px] tracking-[-0.65px] text-ink">{t('bank.title')}</h1>
          <p className="text-[14px] leading-[20px] text-muted">{t('bank.subtitle')}</p>
        </div>

        <div className="relative pb-[24px]">
          <label htmlFor="bank-search" className="sr-only">
            {t('bank.searchLabel')}
          </label>
          <input
            id="bank-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('bank.searchPlaceholder')}
            className="h-[52px] w-full rounded-[12px] bg-white pl-[44px] pr-[16px] text-[14px] text-ink shadow-field outline-none placeholder:text-outline-2"
          />
          <div className="pointer-events-none absolute left-0 top-0 flex h-[52px] items-center pl-[16px]">
            <FigmaImg id="988f1" />
          </div>
        </div>

        {banks.loading ? <StatePanel variant="loading" title={t('common.loading')} /> : null}

        {banks.error ? (
          <StatePanel
            variant="error"
            title={t('common.errorTitle')}
            body={t(errorMessageKey(isApiError(banks.error) ? banks.error.code : undefined))}
            actionLabel={t('common.retry')}
            onAction={banks.reload}
          />
        ) : null}

        {!banks.loading && !banks.error && visibleBanks.length === 0 ? (
          <StatePanel variant="empty" title={t('bank.empty')} body={t('bank.emptyBody')} />
        ) : null}

        {visibleBanks.length > 0 ? (
          <div
            role="radiogroup"
            aria-label={showAll ? t('bank.allBanksLabel') : t('bank.radioLabel')}
            className="grid grid-cols-2 gap-[12px] pb-[24px]"
          >
            {visibleBanks.map((bank) => {
              const on = bank.id === selectedId;
              return (
                <button
                  key={bank.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => selectBank(bank.id)}
                  className={`relative flex h-[114px] flex-col items-center justify-center rounded-[12px] p-[12px] ${on ? 'bg-surface drop-shadow-tile' : 'bg-white drop-shadow-card'}`}
                >
                  <div className="flex h-[44px] w-[36px] flex-col items-start pb-[8px]">
                    <div className="flex size-[36px] items-center justify-center">
                      <BankEmblem emblem={bank.emblem} name={bank.name} />
                    </div>
                  </div>
                  <span className="w-full overflow-clip px-[4px] text-center text-[12px] font-medium leading-[16px] tracking-[0.24px] text-ink">
                    {bank.name}
                  </span>
                  {on && (
                    <span className="absolute right-[10px] top-[10px] flex size-[18px] items-center justify-center rounded-full bg-navy">
                      <FigmaImg id="7166a" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : null}

        {hasMoreBanks ? (
          <div className="flex items-center justify-center pb-[32px]">
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="flex items-center justify-center gap-[6px] rounded-full px-[16px] py-[8px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-teal"
            >
              <span>{showAll ? t('bank.viewPopular') : t('bank.viewAll')}</span>
              <FigmaImg id="669d2" />
            </button>
          </div>
        ) : null}

        <div className="mt-auto pt-[16px]">
          <Cta
            icon="77060"
            iconClassName="ml-[6px]"
            disabled={!selectedId}
            onClick={() => navigate('/form')}
            className="h-[54px] rounded-[12px] bg-navy text-[14px] font-semibold leading-[20px] text-white drop-shadow-card"
          >
            {t('common.continue')}
          </Cta>
        </div>
      </main>
    </Screen>
  );
}
