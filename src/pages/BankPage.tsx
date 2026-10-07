import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import BackButton from '../components/BackButton';
import Cta from '../components/Cta';
import FigmaImg from '../components/FigmaImg';
import StepBars from '../components/StepBars';
import { banks } from '../data/banks';

export default function BankPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('sbi');
  return (
    <Screen>
      <main className="flex flex-1 flex-col px-[24px] pb-[24px]">
        <div className="flex h-[64px] items-start pb-[16px] pt-[8px]">
          <div className="flex h-[40px] w-full items-center justify-between">
            <BackButton to="/language" icon="fe25d" />
            <div className="flex flex-col items-end gap-[6px]">
              <span className="text-[11px] font-medium leading-[14px] tracking-[0.44px] text-muted">Step 2 of 4</span>
              <div className="w-[96px]">
                <StepBars filled={2} barClass="h-[6px] min-w-px flex-1" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[4px] pb-[24px]">
          <h1 className="text-[26px] font-semibold leading-[34px] tracking-[-0.65px] text-ink">Select your bank</h1>
          <p className="text-[14px] leading-[20px] text-muted">Choose the bank for your form.</p>
        </div>

        <div className="relative pb-[24px]">
          <label htmlFor="bank-search" className="sr-only">Search your bank</label>
          <input
            id="bank-search"
            type="search"
            placeholder="Search your bank"
            className="h-[52px] w-full rounded-[12px] bg-white pl-[44px] pr-[16px] text-[14px] text-ink shadow-field outline-none placeholder:text-outline-2"
          />
          <div className="pointer-events-none absolute left-0 top-0 flex h-[52px] items-center pl-[16px]">
            <FigmaImg id="988f1" />
          </div>
        </div>

        <div role="radiogroup" aria-label="Popular banks" className="grid grid-cols-2 gap-[12px] pb-[24px]">
          {banks.map((bank) => {
            const on = bank.id === selected;
            return (
              <button
                key={bank.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSelected(bank.id)}
                className={`relative flex h-[114px] flex-col items-center justify-center rounded-[12px] p-[12px] ${on ? 'bg-surface drop-shadow-tile' : 'bg-white drop-shadow-card'}`}
              >
                <div className="flex h-[44px] w-[36px] flex-col items-start pb-[8px]">
                  <div className="flex size-[36px] items-center justify-center">
                    <FigmaImg id={bank.emblem} />
                  </div>
                </div>
                <span className="w-full overflow-clip px-[4px] text-center text-[12px] font-medium leading-[16px] tracking-[0.24px] text-ink">{bank.name}</span>
                {on && (
                  <span className="absolute right-[10px] top-[10px] flex size-[18px] items-center justify-center rounded-full bg-navy">
                    <FigmaImg id="7166a" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center pb-[32px]">
          <button type="button" className="flex items-center justify-center gap-[6px] rounded-full px-[16px] py-[8px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-teal">
            <span>View all banks</span>
            <FigmaImg id="669d2" />
          </button>
        </div>

        <div className="mt-auto pt-[16px]">
          <Cta
            icon="77060"
            iconClassName="ml-[6px]"
            onClick={() => navigate('/form')}
            className="h-[54px] rounded-[12px] bg-navy text-[14px] font-semibold leading-[20px] text-white drop-shadow-card"
          >
            Continue
          </Cta>
        </div>
      </main>
    </Screen>
  );
}
