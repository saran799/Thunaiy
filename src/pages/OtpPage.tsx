import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import FigmaImg from '../components/FigmaImg';
import { mockUser } from '../data/user';

/** Static sample state exactly as drawn in Figma (4 digits entered, 5th focused, 6th empty). Real OTP input is added in the next phase. */
const OTP_BOXES: { value: string; state: 'filled' | 'active' | 'empty' }[] = [
  { value: '8', state: 'filled' },
  { value: '4', state: 'filled' },
  { value: '2', state: 'filled' },
  { value: '9', state: 'filled' },
  { value: '', state: 'active' },
  { value: '•', state: 'empty' },
];

export default function OtpPage() {
  const navigate = useNavigate();
  return (
    <Screen>
      <main className="px-[16px] pb-[24px]">
        <div className="flex h-[56px] items-center justify-between pt-[4px]">
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate('/register')}
            className="flex size-[40px] items-center justify-center rounded-full bg-surface"
          >
            <FigmaImg id="91d21" />
          </button>
          <div className="size-[40px]" aria-hidden="true" />
        </div>

        <div className="pt-[24px]">
          <h1 className="text-[26px] font-semibold leading-[34px] tracking-[-0.65px] text-ink">Verify your mobile number</h1>
          <div className="flex flex-col gap-[6px] pt-[8px]">
            <p className="text-[16px] leading-[24px] tracking-[-0.08px] text-muted">We sent a 6-digit OTP to</p>
            <div className="flex items-center gap-[8px]">
              <span className="text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">{mockUser.phone}</span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-[12px] font-medium leading-[16px] tracking-[0.24px] text-teal underline decoration-1"
              >
                Change number
              </button>
            </div>
          </div>

          <div className="mt-[24px] flex items-center gap-[10px] rounded-[8px] bg-surface p-[12px] drop-shadow-card">
            <div className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-cyan">
              <FigmaImg id="2bb9c" />
            </div>
            <p className="pr-[15.28px] text-[12px] leading-[18px] tracking-[0.06px] text-muted">
              Auto-reading SMS verification code. You can also type it manually.
            </p>
          </div>

          <div className="flex flex-col items-center pt-[32px]">
            <div role="group" aria-label="One-time password" className="flex w-full max-w-[358px] items-start justify-center gap-[8px]">
              {OTP_BOXES.map((box, i) => (
                <div
                  key={i}
                  className={`relative flex h-[54px] min-w-px flex-1 items-center justify-center rounded-[12px] text-[22px] font-semibold tracking-[-0.33px] ${
                    box.state === 'active'
                      ? 'bg-cyan shadow-cta'
                      : box.state === 'empty'
                        ? 'bg-white text-outline drop-shadow-card'
                        : 'bg-white text-ink drop-shadow-card'
                  }`}
                >
                  {box.value}
                </div>
              ))}
            </div>
            <button type="button" className="mt-[24px] pt-[4px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-teal">
              Resend OTP
            </button>
          </div>

          <div className="flex flex-col items-center pt-[40px]">
            <button
              type="button"
              onClick={() => navigate('/language')}
              className="flex h-[54px] w-full items-center justify-center rounded-[12px] bg-navy text-[14px] font-semibold leading-[20px] tracking-[0.35px] text-white opacity-75 shadow-cta"
            >
              <span>Verify &amp; Continue</span>
              <span className="pl-[8px]">
                <FigmaImg id="77060" />
              </span>
            </button>
            <div className="pt-[12px]">
              <div aria-hidden="true" className="flex items-center gap-[6px] rounded-full bg-surface-2 px-[12px] py-[4px] opacity-0">
                <FigmaImg id="94568" />
                <span className="text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">Validating authentication code...</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-[8px] pb-[8px] pt-[64px]">
            <FigmaImg id="fc917" />
            <p className="text-center text-[12px] leading-[18px] text-muted">Your information stays under your control.</p>
          </div>
        </div>
      </main>
    </Screen>
  );
}
