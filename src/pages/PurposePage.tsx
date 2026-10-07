import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import BackButton from '../components/BackButton';
import Cta from '../components/Cta';
import FigmaImg from '../components/FigmaImg';
import StepBars from '../components/StepBars';
import { purposes } from '../data/purposes';

export default function PurposePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('open-new');
  return (
    <Screen className="pb-[24px]">
      <header className="flex items-center justify-between px-[24px] pb-[8px] pt-[16px]">
        <BackButton to="/form" icon="fe25d" />
        <div className="flex items-center gap-[12px]">
          <StepBars filled={4} barClass="h-[6px] w-[16px]" />
          <span className="text-[11px] font-semibold leading-[14px] tracking-[0.55px] text-muted">4 of 4</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-[24px] pt-[8px]">
        <div className="flex h-[44px] items-center gap-[10px] rounded-[12px] bg-white px-[14px] drop-shadow-card">
          <FigmaImg id="67a89" />
          <p className="overflow-clip whitespace-nowrap">
            <span className="text-[12px] leading-[16px] tracking-[0.24px] text-muted">Selected form: </span>
            <span className="pl-[2px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">Account Opening Form</span>
          </p>
        </div>

        <div className="flex flex-col gap-[8px] pt-[24px]">
          <h1 className="text-[26px] font-semibold leading-[34px] tracking-[-0.65px] text-ink">What are you using this form for?</h1>
          <p className="text-[16px] leading-[24px] tracking-[-0.08px] text-muted">Choose the option that matches what you need to do.</p>
        </div>

        <div role="radiogroup" aria-label="Form purpose options" className="flex w-[calc(100%+4.94px)] flex-col gap-[12px] pt-[24px]">
          {purposes.map((purpose) => {
            const on = purpose.id === selected;
            return (
              <button
                key={purpose.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSelected(purpose.id)}
                className={`flex h-[62px] w-full items-center justify-between rounded-[12px] px-[16px] text-left ${
                  on ? 'bg-[rgba(149,241,255,0.2)] shadow-[inset_0px_0px_0px_1.5px_#006874]' : 'bg-white shadow-[inset_0px_0px_0px_1px_#d9e3f1]'
                }`}
              >
                <div className="flex items-center gap-[14px]">
                  <div className={`flex size-[36px] shrink-0 items-center justify-center rounded-[8px] ${on ? 'bg-guidance-tint' : 'bg-surface'}`}>
                    <FigmaImg id={purpose.icon} />
                  </div>
                  <span className="overflow-clip whitespace-nowrap text-[16px] font-semibold leading-[24px] tracking-[-0.08px] text-ink">{purpose.label}</span>
                </div>
                <span
                  className={`flex size-[20px] shrink-0 items-center justify-center rounded-full bg-white ${
                    on ? 'shadow-[inset_0px_0px_0px_1.5px_#006874]' : 'shadow-[inset_0px_0px_0px_1.5px_#c2c7cf]'
                  }`}
                >
                  {on && <span className="size-[10px] rounded-full bg-teal" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-auto pb-[8px] pt-[32px]">
          <Cta
            icon="77060"
            onClick={() => navigate('/viewer')}
            className="h-[54px] gap-[8px] rounded-[14px] bg-navy text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-white shadow-cta"
          >
            View My Form
          </Cta>
        </div>
      </main>
    </Screen>
  );
}
