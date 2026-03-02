"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageToggle } from "@/components/common/LanguageToggle";

function HomePage() {
  const t = useTranslations("home");

  const features = [
    { icon: "⬡", key: "dragAndDrop" },
    { icon: "◈", key: "accurateBacktest" },
    { icon: "▣", key: "analytics" },
  ] as const;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-(--color-border-subtle) px-8 h-14 flex items-center">
        <span className="text-base font-bold text-(--color-accent)">
          AlphaNodes
        </span>
        <div className="flex-1" />
        <LanguageToggle />
        <Link
          href="/builder"
          className="ml-3 px-4 py-1.5 text-sm font-semibold rounded-md bg-(--color-accent) hover:bg-(--color-accent-hover) text-white transition-colors"
        >
          {t("header.startButton")}
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 text-xs font-medium text-(--color-accent)">
            {t("hero.badge")}
          </div>

          <h1 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
            {t("hero.headline1")}
            <br />
            <span className="text-(--color-accent)">{t("hero.headline2")}</span>
          </h1>

          <p className="text-base text-(--color-text-secondary) leading-relaxed max-w-lg mx-auto">
            {t("hero.description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/builder"
              className="px-8 py-3 text-sm font-semibold rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) text-white transition-colors"
            >
              {t("hero.cta")}
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {features.map((f) => (
            <div
              key={f.key}
              className="text-left p-5 rounded-xl border border-(--color-border-subtle) bg-(--color-bg-elevated)"
            >
              <span className="text-2xl text-(--color-accent)">{f.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                {t(`features.${f.key}.title`)}
              </h3>
              <p className="mt-1.5 text-xs text-(--color-text-secondary) leading-relaxed">
                {t(`features.${f.key}.description`)}
              </p>
            </div>
          ))}
        </div>

        {/* Supported blocks hint */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {[
            "SMA",
            "EMA",
            "RSI",
            "MACD",
            "Bollinger",
            "ATR",
            "교차",
            "비교",
            "임계값",
            "AND/OR",
            "BUY",
            "SELL",
          ].map((b) => (
            <span
              key={b}
              className="px-2.5 py-1 rounded-full text-xs font-medium border border-(--color-border-default) text-(--color-text-muted)"
            >
              {b}
            </span>
          ))}
        </div>
      </main>

      <footer className="border-t border-(--color-border-subtle) px-8 py-4 text-center text-xs text-(--color-text-muted)">
        {t("footer")}
      </footer>
    </div>
  );
}

export default HomePage;
