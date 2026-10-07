import { useNavigate } from 'react-router-dom';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import FigmaImg from '../components/FigmaImg';
import { recentForms } from '../data/forms';

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <Screen className="pb-[80px] pt-[56px]">
      <AppHeader variant="home" />
      <main className="px-[24px] pb-[24px]">
        <div className="pt-[24px]">
          <p className="text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-muted">Welcome back</p>
          <h1 className="pt-[4px] text-[22px] font-semibold leading-[30px] tracking-[-0.55px] text-ink">What form do you need help with?</h1>
        </div>

        <div className="pt-[20px]">
          <button
            type="button"
            onClick={() => navigate('/bank')}
            className="flex h-[52px] w-full items-center justify-center gap-[8px] rounded-[12px] bg-teal text-[14px] font-semibold leading-[20px] text-white drop-shadow-card"
          >
            <span>Find a bank form</span>
            <FigmaImg id="77060" />
          </button>
        </div>

        <section className="pt-[32px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold leading-[26px] tracking-[-0.18px] text-ink">Recent forms</h2>
            <button type="button" onClick={() => navigate('/forms')} className="py-[4px] text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-teal">
              See all
            </button>
          </div>
          <ul className="flex flex-col gap-[8px] pt-[16px]">
            {recentForms.map((form) => (
              <li key={form.id}>
                <button type="button" className="flex w-full items-center gap-[16px] rounded-[12px] bg-white p-[16px] text-left drop-shadow-card">
                  <div className="flex size-[48px] shrink-0 items-center justify-center rounded-[12px] bg-surface-2">
                    <FigmaImg id={form.icon} />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-center">
                    <h3 className="overflow-clip text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">{form.title}</h3>
                    <p className="overflow-clip pt-[2px] text-[12px] leading-[18px] tracking-[0.06px] text-muted">{form.bankName}</p>
                    <div className="flex items-center pt-[4px]">
                      {form.status === 'completed' ? (
                        <span className="flex items-center rounded-full bg-cyan px-[8px] py-[2px] text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-teal-dark">
                          Guidance completed
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">Viewed recently</span>
                      )}
                    </div>
                  </div>
                  <FigmaImg id="a9ff4" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="pt-[32px]">
          <div className="flex items-start gap-[16px] rounded-[12px] bg-surface p-[16px]">
            <div className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-track">
              <FigmaImg id="9e00f" />
            </div>
            <div className="pt-[2px]">
              <p className="text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">Your recent forms will appear here.</p>
              <p className="pt-[2px] text-[12px] leading-[18px] tracking-[0.06px] text-muted">Start by finding a bank form.</p>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </Screen>
  );
}
