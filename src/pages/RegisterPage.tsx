import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import FigmaImg from '../components/FigmaImg';
import Cta from '../components/Cta';

export default function RegisterPage() {
  const navigate = useNavigate();
  return (
    <Screen>
      <main className="flex flex-1 flex-col justify-between px-[16px] py-[32px]">
        <div>
          <div className="flex items-center gap-[12px] pb-[24px]">
            <FigmaImg id="50a7e" />
            <div>
              <p className="text-[15px] font-semibold uppercase leading-[20px] tracking-[0.375px] text-teal">THUNAIY</p>
              <p className="text-[12px] leading-[20px] text-subtle">Your Guide. Every Step.</p>
            </div>
          </div>
          <h1 className="pb-[8px] text-[28px] font-semibold leading-[35px] text-ink-2">Welcome to Thunaiy</h1>
          <p className="text-[16px] leading-[20px] text-subtle">Let’s get you started.</p>

          <div className="flex flex-col gap-[20px] pt-[32px]">
            <div>
              <label htmlFor="full-name" className="block pb-[8px] text-[14px] font-medium leading-[20px] text-ink-2">
                Full name
              </label>
              <div className="rounded-[12px] border border-hairline bg-white p-px drop-shadow-card focus-within:border-teal">
                <input
                  id="full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="h-[54px] w-full rounded-[12px] bg-transparent px-[16px] text-[15px] text-ink-2 outline-none placeholder:text-placeholder"
                />
              </div>
            </div>

            <div>
              <label htmlFor="mobile" className="block pb-[8px] text-[14px] font-medium leading-[20px] text-ink-2">
                Mobile number
              </label>
              <div className="flex h-[54px] items-center overflow-clip rounded-[12px] border border-hairline bg-white p-px shadow-field focus-within:border-teal">
                <div className="flex h-full shrink-0 items-center gap-[6px] border-r border-hairline bg-[#f1f5f9] pl-[14px] pr-[15px]">
                  <span className="text-[14px] font-semibold leading-[20px] text-ink-2">+91</span>
                  <FigmaImg id="ee07b" />
                </div>
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="Enter your mobile number"
                  className="h-full min-w-0 flex-1 bg-transparent px-[16px] text-[15px] text-ink-2 outline-none placeholder:text-placeholder"
                />
              </div>
            </div>

            <div className="pt-[8px]">
              <Cta
                icon="77060"
                onClick={() => navigate('/otp')}
                className="h-[54px] gap-[8.01px] rounded-[14px] bg-navy text-[16px] font-semibold leading-[20px] text-white drop-shadow-card"
              >
                Get Started
              </Cta>
              <p className="pt-[12px] text-center text-[14px] leading-[20px] text-subtle">You’ll receive an OTP on your mobile number.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-[6px] pb-[8px] pt-[64px]">
          <FigmaImg id="96933" />
          <p className="text-center text-[13px] leading-[20px] text-subtle">Your information stays under your control.</p>
        </div>
      </main>
    </Screen>
  );
}
