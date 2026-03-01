import Link from 'next/link';

const FEATURES = [
  {
    icon: '⬡',
    title: '블록 드래그앤드롭',
    description: '코드 없이 SMA, RSI, MACD 등 지표 블록을 조합하여 전략을 시각적으로 구성하세요.',
  },
  {
    icon: '◈',
    title: '정확한 백테스트',
    description: '수수료·슬리피지를 반영한 현실적인 시뮬레이션으로 전략의 실제 성과를 확인하세요.',
  },
  {
    icon: '▣',
    title: '성과 분석',
    description: 'MDD, 샤프 지수, 승률, 손익비 등 핵심 지표와 자산 곡선 차트를 한눈에 확인하세요.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-(--color-border-subtle) px-8 h-14 flex items-center">
        <span className="text-base font-bold text-(--color-accent)">AlphaNodes</span>
        <div className="flex-1" />
        <Link
          href="/builder"
          className="px-4 py-1.5 text-sm font-semibold rounded-md bg-(--color-accent) hover:bg-(--color-accent-hover) text-white transition-colors"
        >
          시작하기
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="max-w-2xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-(--color-accent)/40 bg-(--color-accent)/10 text-xs font-medium text-(--color-accent)">
            Phase 1 · Mock 데이터 기반
          </div>

          <h1 className="text-4xl font-bold text-foreground leading-tight tracking-tight">
            코드 없이 만드는<br />
            <span className="text-(--color-accent)">매매 전략 백테스터</span>
          </h1>

          <p className="text-base text-(--color-text-secondary) leading-relaxed max-w-lg mx-auto">
            블록을 드래그하고 연결하는 것만으로 SMA 교차, RSI 과매도 전략 등을 구성하고
            즉시 백테스트 결과를 확인하세요.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/builder"
              className="px-8 py-3 text-sm font-semibold rounded-xl bg-(--color-accent) hover:bg-(--color-accent-hover) text-white transition-colors"
            >
              전략 빌더 열기
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="text-left p-5 rounded-xl border border-(--color-border-subtle) bg-(--color-bg-elevated)"
            >
              <span className="text-2xl text-(--color-accent)">{f.icon}</span>
              <h3 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-xs text-(--color-text-secondary) leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Supported blocks hint */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {['SMA', 'EMA', 'RSI', 'MACD', 'Bollinger', 'ATR', '교차', '비교', '임계값', 'AND/OR', 'BUY', 'SELL'].map((b) => (
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
        AlphaNodes · 노코드 백테스팅 플랫폼
      </footer>
    </div>
  );
}
