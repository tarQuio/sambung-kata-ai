
export enum GameMode {
  MENU = 'MENU',
  PVP_LOCAL = 'PVP_LOCAL', // Pass and play
  PVE = 'PVE' // Player vs AI
}

export enum PlayerType {
  PLAYER_1 = 'PLAYER_1',
  PLAYER_2 = 'PLAYER_2',
  AI = 'AI'
}

export enum GameTheme {
  ANY = 'Bebas',
  ANIMALS = 'Hewan',
  FRUITS_VEG = 'Buah & Sayur',
  PLACES = 'Negara & Kota',
  OBJECTS = 'Benda Mati',
  JOBS = 'Pekerjaan/Profesi'
}

export interface WordEntry {
  id: string;
  word: string;
  player: PlayerType;
  timestamp: number;
}

export interface GameState {
  mode: GameMode;
  theme: GameTheme;
  currentTurn: PlayerType;
  history: WordEntry[];
  streak: number; // Replaced score with streak count
  isGameOver: boolean;
  winner: PlayerType | null;
  lastWord: string | null;
  timer: number;
}

export interface ValidationResult {
  isValid: boolean;
  fitsTheme: boolean;
  message: string;
}

// Extend Window for Speech Recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
