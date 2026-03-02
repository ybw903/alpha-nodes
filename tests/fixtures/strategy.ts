import type {
  StrategyNode,
  StrategyEdge,
  BlockType,
  BlockParams,
  BlockCategory,
} from "@/types/strategy";
import type { BacktestRequest } from "@/types/backtest";

const BASE_TS = new Date("2023-01-01").getTime();
const END_TS = new Date("2024-01-01").getTime();

/** ReactFlow Node<StrategyNodeData> 최소 구조를 갖춘 노드 생성 헬퍼 */
export function makeNode(
  id: string,
  blockType: BlockType,
  params: Partial<BlockParams> = {},
  category: BlockCategory = "indicator",
): StrategyNode {
  return {
    id,
    type: "strategyNode",
    position: { x: 0, y: 0 },
    data: {
      blockType,
      category,
      label: blockType,
      params: params as BlockParams,
    },
  };
}

/** StrategyEdge 생성 헬퍼 */
export function makeEdge(
  id: string,
  source: string,
  target: string,
  opts: Partial<Pick<StrategyEdge, "sourceHandle" | "targetHandle">> = {},
): StrategyEdge {
  return {
    id,
    source,
    target,
    sourceHandle: opts.sourceHandle ?? null,
    targetHandle: opts.targetHandle ?? null,
  };
}

/**
 * 기본 테스트용 전략 (SMA > PRICE → BUY, SMA < PRICE → SELL).
 * engine.test.ts에서 fetchMarketData를 모킹할 때 사용.
 */
export function makeSimpleStrategy(
  overrides: Partial<Omit<BacktestRequest, "strategy">> = {},
): BacktestRequest {
  const sma = makeNode("sma", "SMA", { period: 5, source: "close" });
  const price = makeNode("price", "PRICE", { field: "close" });
  const compareBuy = makeNode("compareBuy", "COMPARE", { operator: ">" }, "condition");
  const compareShell = makeNode("compareSell", "COMPARE", { operator: "<" }, "condition");
  const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");
  const sell = makeNode("sell", "SELL", { positionSizePct: 100 }, "action");

  const edges: StrategyEdge[] = [
    makeEdge("e1", "sma", "compareBuy", { targetHandle: "a" }),
    makeEdge("e2", "price", "compareBuy", { targetHandle: "b" }),
    makeEdge("e3", "compareBuy", "buy", { targetHandle: "signal" }),
    makeEdge("e4", "sma", "compareSell", { targetHandle: "a" }),
    makeEdge("e5", "price", "compareSell", { targetHandle: "b" }),
    makeEdge("e6", "compareSell", "sell", { targetHandle: "signal" }),
  ];

  return {
    strategy: {
      meta: {
        id: "test-strategy",
        name: "Test Strategy",
        assetClass: "STOCK",
        symbol: "AAPL",
        timeframe: "1d",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      nodes: [sma, price, compareBuy, compareShell, buy, sell],
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    },
    initialCapital: 10_000,
    feeRatePct: 0.05,
    slippagePct: 0.05,
    from: BASE_TS,
    to: END_TS,
    ...overrides,
  };
}

/** Stop-Loss가 설정된 전략 */
export function makeStrategyWithSL(stopLossPct: number): BacktestRequest {
  const base = makeSimpleStrategy();
  const sellNode = base.strategy.nodes.find((n) => n.data.blockType === "SELL")!;
  return {
    ...base,
    strategy: {
      ...base.strategy,
      nodes: base.strategy.nodes.map((n) =>
        n.id === sellNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                params: { positionSizePct: 100, stopLossPct },
              },
            }
          : n,
      ),
    },
  };
}

/** Trailing Stop이 설정된 전략 */
export function makeStrategyWithTrailing(trailingStopPct: number): BacktestRequest {
  const base = makeSimpleStrategy();
  const sellNode = base.strategy.nodes.find((n) => n.data.blockType === "SELL")!;
  return {
    ...base,
    strategy: {
      ...base.strategy,
      nodes: base.strategy.nodes.map((n) =>
        n.id === sellNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                params: { positionSizePct: 100, trailingStopPct },
              },
            }
          : n,
      ),
    },
  };
}

/** exitAfterBars가 설정된 전략 */
export function makeStrategyWithTimeExit(exitAfterBars: number): BacktestRequest {
  const base = makeSimpleStrategy();
  const sellNode = base.strategy.nodes.find((n) => n.data.blockType === "SELL")!;
  return {
    ...base,
    strategy: {
      ...base.strategy,
      nodes: base.strategy.nodes.map((n) =>
        n.id === sellNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                params: { positionSizePct: 100, exitAfterBars },
              },
            }
          : n,
      ),
    },
  };
}
