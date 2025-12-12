export interface ExpansionSettings {
  top: number;
  bottom: number;
  left: number;
  right: number;
  prompt: string;
}

export enum AppState {
  IDLE = 'IDLE',
  EDITING = 'EDITING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface GeneratedImage {
  originalSrc: string;
  resultSrc: string;
  timestamp: number;
}
