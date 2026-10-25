import { useState } from 'react';
import { figmaAssets, type FigmaAssetId } from '../assets/figmaAssets';

interface Props {
  id: FigmaAssetId;
  className?: string;
  alt?: string;
}

/**
 * Renders a static asset exported from Figma at its exact Figma slot size.
 * Handles load errors gracefully without displaying broken image badges.
 */
export default function FigmaImg({ id, className = '', alt = '' }: Props) {
  const [failed, setFailed] = useState(false);
  const a = figmaAssets[id];

  if (!a) {
    return null;
  }

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={`inline-block shrink-0 ${className}`}
        style={{ width: a.w, height: a.h }}
      />
    );
  }

  return (
    <img
      alt={alt}
      aria-hidden={!alt}
      draggable={false}
      width={a.w}
      height={a.h}
      src={`${import.meta.env.BASE_URL}assets/figma/${id}.${a.ext}`}
      onError={() => setFailed(true)}
      className={`block shrink-0 max-w-none ${className}`}
      style={{ width: a.w, height: a.h }}
    />
  );
}

