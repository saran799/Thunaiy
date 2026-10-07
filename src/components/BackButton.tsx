import { useNavigate } from 'react-router-dom';
import FigmaImg from './FigmaImg';
import type { FigmaAssetId } from '../assets/figmaAssets';

/** Figma back control: 32px wide slot with a 40px round hit area offset -8px. */
export default function BackButton({ to, icon }: { to: string; icon: FigmaAssetId }) {
  const navigate = useNavigate();
  return (
    <button type="button" aria-label="Go back" onClick={() => navigate(to)} className="relative h-[40px] w-[32px] shrink-0">
      <span className="absolute left-[-8px] top-0 flex size-[40px] items-center justify-center rounded-full">
        <FigmaImg id={icon} />
      </span>
    </button>
  );
}
