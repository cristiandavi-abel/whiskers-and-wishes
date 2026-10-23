export type SaveData = {
  stars: number;
  catsFound: string[];
  questsDone: string[];
  currentArea: string;
};

const KEY = 'whiskers-wishes-save-v1';

export class SaveManager {
  static load(): SaveData {
    const fallback: SaveData = { stars: 0, catsFound: [], questsDone: [], currentArea: 'garden' };
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      return {
        stars: Number.isFinite(parsed.stars) ? Math.max(0, Number(parsed.stars)) : 0,
        catsFound: Array.isArray(parsed.catsFound) ? parsed.catsFound.filter((v): v is string => typeof v === 'string') : [],
        questsDone: Array.isArray(parsed.questsDone) ? parsed.questsDone.filter((v): v is string => typeof v === 'string') : [],
        currentArea: typeof parsed.currentArea === 'string' ? parsed.currentArea : 'garden',
      };
    } catch {
      return fallback;
    }
  }

  static save(data: SaveData): void {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* O jogo continua mesmo sem armazenamento. */ }
  }

  static reset(): void {
    try { localStorage.removeItem(KEY); } catch { /* Ignorado. */ }
  }
}
