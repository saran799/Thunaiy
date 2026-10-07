import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import FigmaImg from '../components/FigmaImg';
import ProfileButton from '../components/ProfileButton';

export default function CompletePage() {
  const navigate = useNavigate();
  return (
    <Screen>
      <header className="fixed inset-x-0 top-0 z-20 mx-auto w-full max-w-[430px] bg-[rgba(247,249,255,0.8)] shadow-header backdrop-blur-[12px]">
        <div className="relative flex h-[56px] items-center justify-between px-[16px]">
          <div className="relative h-[44px] w-[40px] shrink-0">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => navigate('/viewer')}
              className="absolute left-[-4px] top-0 flex size-[44px] items-center justify-center rounded-full"
            >
              <FigmaImg id="fe25d" />
            </button>
          </div>
          <h1 className="absolute left-1/2 top-[15px] -translate-x-1/2 whitespace-nowrap text-[18px] font-semibold leading-[26px] tracking-[-0.18px] text-ink">
            Complete
          </h1>
          <ProfileButton />
        </div>
      </header>

      <main className="flex flex-1 flex-col px-[24px] pb-[32px] pt-[80px]">
        <div className="flex flex-col items-center text-center">
          <div className="flex size-[64px] items-center justify-center rounded-full bg-cyan drop-shadow-card">
            <FigmaImg id="ca5bd" />
          </div>
          <h2 className="pt-[20px] text-[22px] font-semibold leading-[30px] tracking-[-0.33px] text-ink">Form guidance complete</h2>
          <p className="px-[11.91px] pt-[8px] text-[16px] leading-[24px] tracking-[-0.08px] text-muted">You've completed the fields highlighted by Thunaiy.</p>
          <p className="px-[5.34px] pt-[4px] text-[14px] leading-[20px] text-muted">Review your physical form once before submitting it at the bank.</p>
        </div>

        <div className="pt-[28px]">
          <div className="flex flex-col gap-[12px] rounded-[12px] bg-white p-[16px] drop-shadow-summary">
            <div className="flex items-center gap-[12px]">
              <div className="flex size-[40px] shrink-0 items-center justify-center rounded-[8px] bg-surface">
                <FigmaImg id="b847b" />
              </div>
              <div>
                <p className="text-[16px] leading-[24px] tracking-[-0.08px] text-ink">Account Opening Form</p>
                <p className="text-[12px] font-medium leading-[16px] tracking-[0.24px] text-muted">State Bank of India (SBI)</p>
              </div>
            </div>
            <div className="flex">
              <span className="flex items-center gap-[6px] rounded-full bg-cyan px-[12px] py-[4px]">
                <FigmaImg id="ee6a6" />
                <span className="text-[12px] font-medium leading-[16px] tracking-[0.24px] text-teal-dark">Guidance completed</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-[10px] p-[4px] pt-[20px]">
          <div className="pt-[2px]">
            <FigmaImg id="2be67" />
          </div>
          <p className="pr-[24.7px] text-[12px] leading-[18px] tracking-[0.06px] text-muted">
            Thunaiy only provides form guidance. Submit the completed physical form at your bank.
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-[12px] pt-[48px]">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-teal text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-white drop-shadow-card"
          >
            <span>Back to My Forms</span>
            <FigmaImg id="77060" />
          </button>
          <button
            type="button"
            onClick={() => navigate('/viewer')}
            className="flex h-[48px] w-full items-center justify-center rounded-[12px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-navy"
          >
            View Form Again
          </button>
        </div>
      </main>
    </Screen>
  );
}
