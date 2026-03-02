'use client';

import { useRouter, usePathname } from '@/i18n/navigation';
import { useLocale } from 'next-intl';

export function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const toggle = () => {
    const nextLocale = locale === 'ko' ? 'en' : 'ko';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggle}
      className="px-2 py-1 text-xs font-medium rounded-md border border-(--color-border-default) text-(--color-text-secondary) hover:text-foreground transition-colors font-mono"
    >
      {locale === 'ko' ? 'EN' : 'KO'}
    </button>
  );
}
