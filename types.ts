
export enum View {
  INPUT = 'INPUT',
  PREVIEW = 'PREVIEW',
}

export type Lyric = {
  text: string;
  startTime: number;
};

export type AspectRatio = '16:9' | '9:16';

export type HindiFont = 'Mukta' | 'Tiro' | 'Baloo';

export interface AppState {
  view: View;
  audioUrl: string | null;
  imageUrl: string | null;
  rawLyrics: string;
  structuredLyrics: Lyric[];
  error: string | null;
  isLoading: boolean;
  isExporting: boolean;
  songName: string;
  creatorName: string;
  aspectRatio: AspectRatio;
  imageColors: string[];
  hindiFont: HindiFont;
}
