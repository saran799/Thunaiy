import artworkSrc from './artwork.tsx?raw';

export async function computeArtworkHash(): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(artworkSrc);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `sha256:${hashHex}`;
}
