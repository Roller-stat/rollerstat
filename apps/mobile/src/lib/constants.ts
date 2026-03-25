import { AppLocale } from '../types/content';

export const APP_LOCALES: AppLocale[] = ['en', 'es', 'fr', 'it', 'pt'];
export const DEFAULT_LOCALE: AppLocale = 'en';
export const CONTENT_CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

export const REACTION_OPTIONS: Array<{ type: 'like' | 'applaud' | 'love' | 'dislike'; emoji: string }> = [
  { type: 'like', emoji: '👍' },
  { type: 'applaud', emoji: '👏' },
  { type: 'love', emoji: '❤️' },
  { type: 'dislike', emoji: '👎' },
];
