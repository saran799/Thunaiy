import { useNavigate } from 'react-router-dom';
import FigmaImg from './FigmaImg';
import ProfileButton from './ProfileButton';

/** Logo slot: 'THUNAI APP LOGO.jpeg' (199.72 x 32). Drop the file in public/assets/figma/thunai-app-logo.jpeg. */
function LogoSlot() {
  return (
    <div
      aria-hidden="true"
      className="h-[32px] w-[199.72px] min-w-0 max-w-[275.16px] shrink bg-contain bg-left bg-no-repeat"
      style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/figma/thunai-app-logo.jpeg)` }}
    />
  );
}

/** Top bar for Home, Forms (variant "home") and Settings (variant "settings"). */
export default function AppHeader({ variant }: { variant: 'home' | 'settings' }) {
  const navigate = useNavigate();
  const bg = variant === 'home' ? 'bg-[rgba(247,249,255,0.8)]' : 'bg-[rgba(255,255,255,0.8)]';
  return (
    <header className={`fixed inset-x-0 top-0 z-20 mx-auto w-full max-w-[430px] shadow-header backdrop-blur-[12px] ${bg}`}>
      <div className="flex h-[56px] items-center justify-between px-[16px]">
        {variant === 'home' ? (
          <div className="flex min-w-0 items-center gap-[8px]">
            <LogoSlot />
            <span className="text-[18px] font-semibold leading-[26px] tracking-[-0.45px] text-deep">Thunaiy</span>
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-[8px]">
            <div className="relative h-[44px] w-[36.89px] shrink-0">
              <button
                type="button"
                aria-label="Go back"
                onClick={() => navigate('/home')}
                className="absolute left-[-4px] top-0 flex h-[44px] w-[40.89px] items-center justify-center rounded-[8px]"
              >
                <FigmaImg id="271b7" />
              </button>
            </div>
            <LogoSlot />
            <h1 className="overflow-hidden text-ellipsis whitespace-nowrap pr-[9.42px] text-[18px] font-semibold leading-[26px] tracking-[-0.18px] text-ink">
              Settings
            </h1>
          </div>
        )}
        <ProfileButton />
      </div>
    </header>
  );
}
