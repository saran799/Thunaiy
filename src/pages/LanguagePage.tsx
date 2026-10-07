import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import BackButton from '../components/BackButton';
import Cta from '../components/Cta';
import StepBars from '../components/StepBars';
import { languages } from '../data/languages';

export default function LanguagePage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('en');
  return (
    <Screen>
      <header className="flex items-center justify-between px-[24px] pb-[16px] pt-[8px]">
        <BackButton to="/otp" icon="8b04a" />
        <div className="flex items-center gap-[8px]">
          <span className="text-[12px] font-medium leading-[16px] tracking-[0.24px] text-muted">1 of 4</span>
          <StepBars filled={1} barClass="h-[4px] w-[24px]" />
        </div>
      </header>
      <main className="px-[24px] pb-[24px]">
        <div className="flex flex-col gap-[8px] pb-[32px] pt-[16px]">
          <h1 className="text-[26px] font-semibold leading-[34px] tracking-[-0.65px] text-ink">Choose your language</h1>
          <p className="text-[16px] leading-[24px] tracking-[-0.08px] text-muted">You can change this anytime in Settings.</p>
        </div>
        <div role="radiogroup" aria-label="Select your primary language" className="flex flex-col gap-[12px]">
          {languages.map((lang) => {
            const on = lang.id === selected;
            return (
              <button
                key={lang.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setSelected(lang.id)}
                className={`flex h-[58px] w-full items-center justify-between rounded-[12px] px-[18px] drop-shadow-card ${on ? 'bg-surface' : 'bg-white'}`}
              >
                <span className={`text-[16px] leading-[24px] tracking-[-0.4px] text-ink ${lang.fontClass}`}>{lang.label}</span>
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
            onClick={() => navigate('/bank')}
            className="h-[54px] gap-[8px] rounded-[14px] bg-navy text-[14px] font-semibold leading-[20px] tracking-[0.35px] text-white shadow-cta"
          >
            Continue
          </Cta>
          <p className="pt-[12px] text-center text-[12px] leading-[18px] tracking-[0.06px] text-muted">Your language preference can be changed later.</p>
        </div>
      </main>
    </Screen>
  );
}
