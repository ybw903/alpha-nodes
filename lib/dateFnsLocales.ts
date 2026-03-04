import type { Locale } from "date-fns";
import { ko, enUS } from "date-fns/locale";

/**
 * Maps next-intl locale codes to date-fns Locale objects.
 * Add an entry here whenever a new language is added to i18n/routing.ts.
 */
const localeMap: Record<string, Locale> = {
  ko,
  en: enUS,
};

export function getDateFnsLocale(locale: string): Locale {
  return localeMap[locale] ?? enUS;
}
