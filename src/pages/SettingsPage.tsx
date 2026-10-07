import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import Screen from '../components/Screen';
import AppHeader from '../components/AppHeader';
import BottomNav from '../components/BottomNav';
import FigmaImg from '../components/FigmaImg';
import type { FigmaAssetId } from '../assets/figmaAssets';
import { mockUser } from '../data/user';

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="px-[4px] text-[11px] font-semibold uppercase leading-[14px] tracking-[0.55px] text-muted">{children}</h2>;
}

function IconBox({ icon, className = 'bg-surface-2' }: { icon: FigmaAssetId; className?: string }) {
  return (
    <div className={`flex size-[32px] shrink-0 items-center justify-center rounded-[8px] ${className}`}>
      <FigmaImg id={icon} />
    </div>
  );
}

/** Settings row. Rows without `onClick` are intentionally non-navigating (matches Figma: no destination screens exist). */
function Row({ icon, label, onClick, trailing }: { icon: FigmaAssetId; label: string; onClick?: () => void; trailing?: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="flex min-h-[48px] w-full items-center justify-between p-[16px] text-left">
      <div className="flex items-center gap-[14px]">
        <IconBox icon={icon} />
        <span className="text-[16px] font-medium leading-[24px] text-ink">{label}</span>
      </div>
      {trailing ?? <FigmaImg id="9d29a" />}
    </button>
  );
}

const Divider = () => (
  <div className="h-px px-[16px]">
    <div className="h-px bg-surface-3" />
  </div>
);

export default function SettingsPage() {
  const navigate = useNavigate();
  return (
    <Screen className="pb-[80px] pt-[56px]">
      <AppHeader variant="settings" />
      <main className="px-[24px] py-[16px]">
        <div className="flex items-center justify-between rounded-[12px] bg-white p-[16px] drop-shadow-card">
          <div className="flex items-center gap-[12px]">
            <div className="flex size-[48px] shrink-0 items-center justify-center rounded-full bg-surface">
              <FigmaImg id="dec7f" />
            </div>
            <div>
              <p className="text-[17px] font-semibold leading-[23.38px] text-ink">{mockUser.name}</p>
              <p className="text-[14px] leading-[20px] text-muted">{mockUser.phone}</p>
            </div>
          </div>
          <button type="button" className="flex items-center gap-[2px] text-[13px] leading-[19.5px] text-teal">
            <span>Edit profile</span>
            <FigmaImg id="e4403" />
          </button>
        </div>

        <section className="flex flex-col gap-[8px] pt-[24px]">
          <SectionTitle>PREFERENCES</SectionTitle>
          <div className="overflow-clip rounded-[12px] bg-white shadow-field">
            <Row
              icon="15326"
              label="Language"
              onClick={() => navigate('/language')}
              trailing={
                <div className="flex items-center gap-[4px]">
                  <span className="text-[14px] leading-[20px] text-muted">English</span>
                  <FigmaImg id="9d29a" />
                </div>
              }
            />
          </div>
        </section>

        <section className="flex flex-col gap-[8px] pt-[24px]">
          <SectionTitle>FORM EXPERIENCE</SectionTitle>
          <div className="flex items-start justify-between rounded-[12px] bg-white p-[16px] drop-shadow-card">
            <div className="flex items-start gap-[14px]">
              <div className="flex h-[34px] w-[32px] shrink-0 flex-col pt-[2px]">
                <IconBox icon="c5ade" />
              </div>
              <div className="pr-[4px]">
                <p className="whitespace-nowrap text-[16px] font-medium leading-[22px] text-ink">Show field guidance</p>
                {/* Description wraps to the width of the title, as in Figma. */}
                <div className="w-0 min-w-full pt-[2px]">
                  <p className="text-[12px] leading-[18px] tracking-[0.06px] text-muted">Show additional guidance when</p>
                  <p className="text-[12px] leading-[18px] tracking-[0.06px] text-muted">available for a highlighted field.</p>
                </div>
              </div>
            </div>
            <div className="pt-[4px]">
              <div role="switch" aria-checked="true" aria-label="Show field guidance" className="relative flex items-center">
                <div className="h-[28px] w-[48px] rounded-full bg-teal" />
                <div className="absolute left-[24px] top-[4px] size-[20px] rounded-full bg-white shadow-knob" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-[8px] pt-[24px]">
          <SectionTitle>SUPPORT</SectionTitle>
          <div className="overflow-clip rounded-[12px] bg-white shadow-field">
            <Row icon="cf99d" label="Help & Support" />
            <Divider />
            <Row icon="e9313" label="Privacy Policy" />
            <Divider />
            <Row icon="0c5af" label="Terms of Use" />
          </div>
        </section>

        <section className="flex flex-col gap-[8px] pt-[24px]">
          <SectionTitle>ABOUT</SectionTitle>
          <div className="overflow-clip rounded-[12px] bg-white shadow-field">
            <Row icon="52f7b" label="About Thunaiy" />
          </div>
          <p className="pb-[1.5px] pt-[8.5px] text-center text-[12px] leading-[18px] tracking-[0.06px] text-outline-2">Thunaiy v1.0.0</p>
        </section>

        <div className="pt-[32px]">
          <div className="overflow-clip rounded-[12px] bg-white shadow-field">
            <button type="button" className="flex min-h-[48px] w-full items-center gap-[14px] p-[16px] text-left">
              <IconBox icon="108d9" className="bg-[rgba(255,218,214,0.3)]" />
              <span className="text-[16px] font-medium leading-[24px] text-danger">Log out</span>
            </button>
          </div>
        </div>
      </main>
      <BottomNav variant="settings" />
    </Screen>
  );
}
