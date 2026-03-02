import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Providers } from "@/components/common/Providers";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const isKo = locale === "ko";
  return {
    title: isKo
      ? "AlphaNodes — 노코드 백테스팅"
      : "AlphaNodes — No-Code Backtesting",
    description: isKo
      ? "코드 없이 블록 드래그앤드롭으로 매매 전략을 구성하고 백테스트하세요."
      : "Build and backtest trading strategies with drag-and-drop blocks — no code required.",
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
