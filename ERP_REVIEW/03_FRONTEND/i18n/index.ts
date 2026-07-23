import { uz, type TranslationKey } from './locales/uz';

export type Locale = 'uz';

export const defaultLocale: Locale = 'uz';

const catalogs: Record<Locale, Record<string, string>> = { uz: uz };

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let text = catalogs[defaultLocale][key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replace(`{${name}}`, String(value));
    }
  }
  return text;
}

export { uz };
