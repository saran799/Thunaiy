import { figmaAssets, type FigmaAssetId } from '../assets/figmaAssets';

interface Props {
  id: FigmaAssetId;
  className?: string;
}

/**
 * Renders a static asset exported from Figma at its exact Figma slot size.
 * Files are served from public/assets/figma/<id>.<ext>; a missing file leaves
 * an empty slot of the correct size so layout is never affected.
 */
export default function FigmaImg({ id, className = '' }: Props) {
  const a = figmaAssets[id];
  return (
    <img
      alt=""
      aria-hidden="true"
      draggable={false}
      width={a.w}
      height={a.h}
      src={`${import.meta.env.BASE_URL}assets/figma/${id}.${a.ext}`}
      className={`block shrink-0 max-w-none ${className}`}
      style={{ width: a.w, height: a.h }}
    />
  );
}
