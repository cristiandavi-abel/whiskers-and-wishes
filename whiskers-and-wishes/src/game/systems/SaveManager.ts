/**
 * Progresso persistido no navegador.
 * A versão 2 guarda IDs de estrelas, missões ativas, inventário e flags
 * narrativas. O formato antigo (v1) é migrado automaticamente.
 */

export type SaveData = {
  version: number;
  stars: number;
  collectedStars: string[];
  catsFound: string[];
  questsDone: string[];
  questsActive: string[];
  inventory: string[];
  flags: string[];
  area: string;
  endingSeen: boolean;
  playTime: number;
};

const KEY = 'whiskers-wishes-save-v2';
const LEGACY_KEY = 'whiskers-wishes-save-v1';
const MUTE_KEY = 'whiskers-wishes-muted';

export function emptySave(): SaveData {
  return {
    version: 2,
    stars: 0,
    collectedStars: [],
    catsFound: [],
    questsDone: [],
    questsActive: [],
    inventory: [],
    flags: [],
    area: 'garden',
    endingSeen: false,
    playTime: 0,
  };
}

const uniqueStrings = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string'))] : [];

export class SaveManager {
  static load(): SaveData {
    const base = emptySave();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SaveData>;
        return {
          ...base,
          stars: Math.max(0, Math.floor(Number(parsed.stars) || 0)),
          collectedStars: uniqueStrings(parsed.collectedStars),
          catsFound: uniqueStrings(parsed.catsFound),
          questsDone: uniqueStrings(parsed.questsDone),
          questsActive: uniqueStrings(parsed.questsActive),
          inventory: uniqueStrings(parsed.inventory),
          flags: uniqueStrings(parsed.flags),
          area: typeof parsed.area === 'string' ? parsed.area : 'garden',
          endingSeen: Boolean(parsed.endingSeen),
          playTime: Math.max(0, Number(parsed.playTime) || 0),
        };
      }

      // Migração do protótipo antigo (v1).
      const legacyRaw = localStorage.getItem(LEGACY_KEY);
      if (legacyRaw) {
        const legacy = JSON.parse(legacyRaw) as {
          stars?: number;
          catsFound?: unknown;
          questsDone?: unknown;
          currentArea?: string;
        };
        return {
          ...base,
          stars: Math.max(0, Math.floor(Number(legacy.stars) || 0)),
          catsFound: uniqueStrings(legacy.catsFound),
          questsDone: uniqueStrings(legacy.questsDone),
          area: typeof legacy.currentArea === 'string' ? legacy.currentArea : 'garden',
        };
      }
    } catch {
      return base;
    }
    return base;
  }

  static save(data: SaveData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* O jogo continua mesmo sem armazenamento. */
    }
  }

  static hasProgress(): boolean {
    try {
      return Boolean(localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY));
    } catch {
      return false;
    }
  }

  static reset(): void {
    try {
      localStorage.removeItem(KEY);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* Ignorado. */
    }
  }

  static isMuted(): boolean {
    try {
      return localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      return false;
    }
  }

  static setMuted(muted: boolean): void {
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {
      /* Ignorado. */
    }
  }
}

/* ── Pequenos utilitários usados pelas cenas ─────────────────── */

export function hasItem(save: SaveData, id: string): boolean {
  return save.inventory.includes(id);
}

export function hasFlag(save: SaveData, flag: string): boolean {
  return save.flags.includes(flag);
}

export function questIsDone(save: SaveData, id: string): boolean {
  return save.questsDone.includes(id);
}

export function questIsActive(save: SaveData, id: string): boolean {
  return save.questsActive.includes(id);
}

export function addOnce(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value);
}
