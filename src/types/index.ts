import type { FigmaAssetId } from '../assets/figmaAssets';

export interface Language {
  id: string;
  label: string;
  /** Tailwind font-family utility; Telugu/Kannada use Noto Sans because the Figma export lacks glyphs. */
  fontClass: string;
}

export interface Bank {
  id: string;
  name: string;
  emblem: FigmaAssetId;
}

export interface FormType {
  id: string;
  title: string;
  description: string;
  selectIcon: FigmaAssetId;
}

export interface Purpose {
  id: string;
  label: string;
  icon: FigmaAssetId;
}

export interface DirectoryForm {
  id: string;
  title: string;
  bankName: string;
  description: string;
  icon: FigmaAssetId;
}

export interface RecentForm {
  id: string;
  title: string;
  bankName: string;
  status: 'completed' | 'viewed';
  icon: FigmaAssetId;
}
