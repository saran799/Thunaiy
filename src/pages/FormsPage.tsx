import { useState } from 'react';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import FigmaImg from '../components/FigmaImg';
import { directoryBankFilters, directoryForms } from '../data/forms';

export default function FormsPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  return (
    <Screen className="pb-[80px] pt-[56px]">
      <AppHeader variant="home" />
      <main className="flex flex-col gap-[16px] px-[24px] pb-[24px] pt-[4px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[4px]">
            <h1 className="text-[22px] font-semibold leading-[30px] tracking-[-0.33px] text-ink">Forms</h1>
            <span className="ml-[4px] rounded-full bg-cyan px-[8px] py-[2px] text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-teal-ink">
              {directoryForms.length}
            </span>
          </div>
          <button type="button" aria-label="Search filter options" className="flex size-[40px] items-center justify-center rounded-full">
            <FigmaImg id="72470" />
          </button>
        </div>

        <div className="flex flex-col gap-[6px]">
          <div className="relative rounded-[8px] bg-white drop-shadow-card">
            <label htmlFor="forms-search" className="sr-only">Search bank forms</label>
            <input
              id="forms-search"
              type="search"
              placeholder="Search bank forms"
              className="h-[48px] w-full rounded-[8px] bg-transparent pl-[44px] pr-[40px] text-[14px] text-muted outline-none placeholder:text-muted"
            />
            <div className="pointer-events-none absolute left-[16.5px] top-[16.5px]">
              <FigmaImg id="0661e" />
            </div>
          </div>
          <p className="pl-[4px] text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">Search by bank name, form title, or purpose</p>
        </div>

        <div className="-mx-[24px] flex h-[44px] items-center gap-[8px] overflow-x-auto px-[24px]">
          {directoryBankFilters.map((name) => {
            const on = name === activeFilter;
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => setActiveFilter(name)}
                className={`flex h-[36px] shrink-0 items-center justify-center rounded-full px-[16px] text-[12px] font-medium leading-[16px] tracking-[0.24px] ${
                  on ? 'bg-cyan text-teal-ink' : 'bg-white text-muted drop-shadow-card'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-[4px]">
          <h2 className="text-[16px] font-semibold leading-[24px] tracking-[-0.08px] text-ink">Available forms</h2>
          <span className="text-[11px] font-semibold leading-[14px] tracking-[0.44px] text-muted">
            Showing {directoryForms.length} of {directoryForms.length}
          </span>
        </div>

        <ul className="flex flex-col gap-[10px]">
          {directoryForms.map((form) => (
            <li key={form.id}>
              <button type="button" className="flex w-full items-center gap-[16px] rounded-[12px] bg-white p-[14px] text-left drop-shadow-card">
                <div className="flex min-w-0 flex-1 items-center gap-[14px]">
                  <div className="flex size-[44px] shrink-0 items-center justify-center rounded-[8px] bg-surface-2">
                    <FigmaImg id={form.icon} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="overflow-clip whitespace-nowrap text-[14px] font-semibold leading-[20px] tracking-[0.14px] text-ink">{form.title}</h3>
                    <p className="whitespace-nowrap text-[11px] font-medium leading-[14px] tracking-[0.44px] text-teal">{form.bankName}</p>
                    {/* The description wraps to the width of the title/bank lines, as in Figma. */}
                    <div className="w-0 min-w-full pt-[2px]">
                      <p className="text-[12px] leading-[18px] tracking-[0.06px] text-muted">{form.description}</p>
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

        <div className="pt-[16px]">
          <div className="flex items-start gap-[12px] rounded-[12px] bg-surface p-[16px]">
            <FigmaImg id="f39b5" />
            <div className="min-w-0">
              <p className="whitespace-nowrap text-[12px] font-medium leading-[16px] tracking-[0.24px] text-ink">Standardized Official Layouts</p>
              <div className="w-0 min-w-full pt-[2px]">
                <p className="text-[12px] leading-[18px] tracking-[0.06px] text-muted">Forms correspond to the current branch</p>
                <p className="text-[12px] leading-[18px] tracking-[0.06px] text-muted">distribution copies for Indian public and</p>
                <p className="text-[12px] leading-[18px] tracking-[0.06px] text-muted">commercial scheduled banks.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </Screen>
  );
}
