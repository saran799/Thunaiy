import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import BackButton from '../components/BackButton';
import Cta from '../components/Cta';
import FigmaImg from '../components/FigmaImg';
import StepBars from '../components/StepBars';
import { formTypes } from '../data/forms';

export default function FormSelectPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('account-opening');
  return (
    <Screen className="pb-[24px]">
      <header className="flex items-center justify-between pb-[16px] pl-[24px] pr-[23.99px] pt-[8px]">
        <BackButton to="/bank" icon="fe25d" />
        <div className="flex items-center gap-[11.99px]">
          <span className="text-[12px] font-medium leading-[16px] tracking-[0.24px] text-muted">Step 3 of 4</span>
          <StepBars filled={3} barClass="h-[6px] w-[20px]" />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="px-[24px] pb-[20px] pt-[8px]">
          <h1 className="text-[26px] font-semibold leading-[34px] tracking-[-0.65px] text-ink">Select your form</h1>
          <p className="pt-[4px] text-[16px] leading-[24px] tracking-[-0.08px] text-muted">Choose the form you need from your selected bank.</p>
        </div>

        <div className="px-[24px] pb-[16px]">
          <div className="flex h-[52px] items-center justify-between rounded-[12px] bg-white px-[16px] drop-shadow-card">
            <div className="flex items-center gap-[12px]">
              <div className="flex size-[28px] items-center justify-center rounded-full bg-sbi-badge">
                <FigmaImg id="d9eec" />
              </div>
              <span className="text-[14px] font-medium leading-[20px] tracking-[0.14px] text-ink">State Bank of India</span>
            </div>
            <button type="button" onClick={() => navigate('/bank')} className="text-[14px] font-medium leading-[20px] tracking-[0.14px] text-teal">
              Change
            </button>
          </div>
        </div>

        <div className="px-[24px] pb-[24px]">
          <div className="flex h-[52px] items-center rounded-[12px] bg-white drop-shadow-card">
            <FigmaImg id="09ce4" />
            <label htmlFor="form-search" className="sr-only">Search forms</label>
            <input
              id="form-search"
              type="search"
              placeholder="Search forms"
              className="h-full min-w-0 flex-1 bg-transparent px-[12px] text-[16px] tracking-[-0.08px] text-muted outline-none placeholder:text-muted"
            />
          </div>
        </div>

        <section className="px-[24px]">
          <div className="flex items-center justify-between pb-[12px]">
            <h2 className="text-[12px] font-semibold uppercase leading-[16px] tracking-[0.6px] text-muted">POPULAR FORMS</h2>
            <span className="text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">{formTypes.length} available</span>
          </div>
          <div role="radiogroup" aria-label="Forms" className="flex flex-col gap-[10px]">
            {formTypes.map((form) => {
              const on = form.id === selected;
              return (
                <button
                  key={form.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSelected(form.id)}
                  className={`flex h-[72px] w-full items-center justify-between rounded-[12px] px-[16px] text-left drop-shadow-card ${on ? 'bg-surface' : 'bg-white'}`}
                >
                  <div className="flex min-w-0 items-center gap-[14px] pr-[8px]">
                    <div className={`flex size-[36px] shrink-0 items-center justify-center rounded-[8px] ${on ? 'bg-cyan' : 'bg-surface-2'}`}>
                      <FigmaImg id={form.selectIcon} />
                    </div>
                    <div className="min-w-0">
                      <p className="overflow-clip whitespace-nowrap text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">{form.title}</p>
                      <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-[18px] tracking-[0.06px] text-muted">{form.description}</p>
                    </div>
                  </div>
                  {on ? (
                    <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-navy">
                      <FigmaImg id="09465" />
                    </span>
                  ) : (
                    <FigmaImg id="9d29a" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <div className="mt-auto px-[24px] pb-[8px] pt-[32px]">
          <Cta
            icon="03d99"
            onClick={() => navigate('/purpose')}
            className="h-[54px] gap-[8px] rounded-[14px] bg-navy text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-white shadow-cta"
          >
            Continue
          </Cta>
        </div>
      </main>
    </Screen>
  );
}
