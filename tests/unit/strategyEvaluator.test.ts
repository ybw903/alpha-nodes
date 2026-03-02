import { describe, it, expect } from "vitest";
import {
  topologicalSort,
  evaluateStrategy,
} from "@/lib/backtest/strategyEvaluator";
import { makeNode, makeEdge } from "@/tests/fixtures";
import type { IndicatorSeries } from "@/lib/backtest/indicators";

function constSeries(value: number | null, length: number): IndicatorSeries {
  return Array(length).fill(value);
}

// ─── topologicalSort ────────────────────────────────────────────────────────

describe("topologicalSort", () => {
  it("선형 A→B→C → A, B, C 순서 보장", () => {
    const nodes = [
      makeNode("A", "SMA", {}, "indicator"),
      makeNode("B", "COMPARE", {}, "condition"),
      makeNode("C", "BUY", {}, "action"),
    ];
    const edges = [makeEdge("e1", "A", "B"), makeEdge("e2", "B", "C")];
    const sorted = topologicalSort(nodes, edges);
    expect(sorted.indexOf("A")).toBeLessThan(sorted.indexOf("B"));
    expect(sorted.indexOf("B")).toBeLessThan(sorted.indexOf("C"));
  });

  it("순환 A→B→A → '순환(cycle)' 에러 throw", () => {
    const nodes = [
      makeNode("A", "SMA", {}, "indicator"),
      makeNode("B", "COMPARE", {}, "condition"),
    ];
    const edges = [makeEdge("e1", "A", "B"), makeEdge("e2", "B", "A")];
    expect(() => topologicalSort(nodes, edges)).toThrow("순환");
  });

  it("연결 없는 독립 노드들 → 모두 포함", () => {
    const nodes = [
      makeNode("A", "SMA", {}),
      makeNode("B", "EMA", {}),
      makeNode("C", "RSI", {}),
    ];
    const sorted = topologicalSort(nodes, []);
    expect(sorted).toHaveLength(3);
    expect(sorted).toContain("A");
    expect(sorted).toContain("B");
    expect(sorted).toContain("C");
  });
});

// ─── evaluateStrategy ───────────────────────────────────────────────────────

describe("evaluateStrategy", () => {
  it("COMPARE(>): a=10, b=5 → 모든 봉 buy=true", () => {
    const barCount = 3;
    const nA = makeNode("nA", "PRICE", { field: "close" });
    const nB = makeNode("nB", "PRICE", { field: "close" });
    const cmp = makeNode("cmp", "COMPARE", { operator: ">" }, "condition");
    const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");

    const nodes = [nA, nB, cmp, buy];
    const edges = [
      makeEdge("e1", "nA", "cmp", { targetHandle: "a" }),
      makeEdge("e2", "nB", "cmp", { targetHandle: "b" }),
      makeEdge("e3", "cmp", "buy", { targetHandle: "signal" }),
    ];
    const indicatorMap = new Map<string, IndicatorSeries>([
      ["nA", constSeries(10, barCount)],
      ["nB", constSeries(5, barCount)],
    ]);

    const signals = evaluateStrategy(nodes, edges, indicatorMap, barCount);
    signals.forEach((s) => expect(s.buy).toBe(true));
  });

  it("COMPARE(==): 부동소수점 0.1+0.2 ≈ 0.3 → epsilon 처리로 true", () => {
    const nA = makeNode("nA", "PRICE", { field: "close" });
    const nB = makeNode("nB", "PRICE", { field: "close" });
    const cmp = makeNode("cmp", "COMPARE", { operator: "==" }, "condition");
    const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");

    const nodes = [nA, nB, cmp, buy];
    const edges = [
      makeEdge("e1", "nA", "cmp", { targetHandle: "a" }),
      makeEdge("e2", "nB", "cmp", { targetHandle: "b" }),
      makeEdge("e3", "cmp", "buy", { targetHandle: "signal" }),
    ];
    const indicatorMap = new Map<string, IndicatorSeries>([
      ["nA", [0.1 + 0.2]], // 0.30000000000000004
      ["nB", [0.3]],
    ]);

    const signals = evaluateStrategy(nodes, edges, indicatorMap, 1);
    expect(signals[0].buy).toBe(true);
  });

  it("CROSSOVER: barIdx=0 → false, 교차 발생 봉(barIdx=1) → true", () => {
    const barCount = 3;
    const nA = makeNode("nA", "PRICE", { field: "close" });
    const nB = makeNode("nB", "PRICE", { field: "close" });
    const cross = makeNode("cross", "CROSSOVER", {}, "condition");
    const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");

    const nodes = [nA, nB, cross, buy];
    const edges = [
      makeEdge("e1", "nA", "cross", { targetHandle: "a" }),
      makeEdge("e2", "nB", "cross", { targetHandle: "b" }),
      makeEdge("e3", "cross", "buy", { targetHandle: "signal" }),
    ];
    // barIdx=0: A=5 < B=10; barIdx=1: A=15 > B=10 → 골든 크로스
    const indicatorMap = new Map<string, IndicatorSeries>([
      ["nA", [5, 15, 15]],
      ["nB", [10, 10, 10]],
    ]);

    const signals = evaluateStrategy(nodes, edges, indicatorMap, barCount);
    expect(signals[0].buy).toBe(false); // barIdx=0 → 항상 false
    expect(signals[1].buy).toBe(true);  // crossover 발생
    expect(signals[2].buy).toBe(false); // 이미 넘어섬, crossover 아님
  });

  it("THRESHOLD(<70): 65→buy=true, 75→buy=false", () => {
    const barCount = 2;
    const num = makeNode("num", "PRICE", { field: "close" });
    const thr = makeNode("thr", "THRESHOLD", { operator: "<", value: 70 }, "condition");
    const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");

    const nodes = [num, thr, buy];
    const edges = [
      makeEdge("e1", "num", "thr", { targetHandle: "value" }),
      makeEdge("e2", "thr", "buy", { targetHandle: "signal" }),
    ];
    const indicatorMap = new Map<string, IndicatorSeries>([
      ["num", [65, 75]],
    ]);

    const signals = evaluateStrategy(nodes, edges, indicatorMap, barCount);
    expect(signals[0].buy).toBe(true);  // 65 < 70
    expect(signals[1].buy).toBe(false); // 75 < 70 → false
  });

  it("AND: true+false → false, true+true → true", () => {
    const barCount = 2;
    const nA = makeNode("nA", "PRICE", { field: "close" });
    const nB = makeNode("nB", "PRICE", { field: "close" });
    const thrA = makeNode("thrA", "THRESHOLD", { operator: "<", value: 70 }, "condition");
    const thrB = makeNode("thrB", "THRESHOLD", { operator: "<", value: 70 }, "condition");
    const andNode = makeNode("and", "AND", {}, "logic");
    const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");

    const nodes = [nA, nB, thrA, thrB, andNode, buy];
    const edges = [
      makeEdge("e1", "nA", "thrA", { targetHandle: "value" }),
      makeEdge("e2", "nB", "thrB", { targetHandle: "value" }),
      makeEdge("e3", "thrA", "and", { targetHandle: "a" }),
      makeEdge("e4", "thrB", "and", { targetHandle: "b" }),
      makeEdge("e5", "and", "buy", { targetHandle: "signal" }),
    ];
    // bar0: thrA(65<70)=true, thrB(75<70)=false → AND=false
    // bar1: thrA(65<70)=true, thrB(65<70)=true  → AND=true
    const indicatorMap = new Map<string, IndicatorSeries>([
      ["nA", [65, 65]],
      ["nB", [75, 65]],
    ]);

    const signals = evaluateStrategy(nodes, edges, indicatorMap, barCount);
    expect(signals[0].buy).toBe(false);
    expect(signals[1].buy).toBe(true);
  });

  it("NOT(true) → false, NOT(false) → true", () => {
    const barCount = 2;
    const num = makeNode("num", "PRICE", { field: "close" });
    const thr = makeNode("thr", "THRESHOLD", { operator: "<", value: 70 }, "condition");
    const notNode = makeNode("not", "NOT", {}, "logic");
    const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");

    const nodes = [num, thr, notNode, buy];
    const edges = [
      makeEdge("e1", "num", "thr", { targetHandle: "value" }),
      makeEdge("e2", "thr", "not", { targetHandle: "a" }),
      makeEdge("e3", "not", "buy", { targetHandle: "signal" }),
    ];
    // bar0: 65 < 70 → true → NOT → false → buy=false
    // bar1: 75 < 70 → false → NOT → true → buy=true
    const indicatorMap = new Map<string, IndicatorSeries>([
      ["num", [65, 75]],
    ]);

    const signals = evaluateStrategy(nodes, edges, indicatorMap, barCount);
    expect(signals[0].buy).toBe(false);
    expect(signals[1].buy).toBe(true);
  });

  it("CONSECUTIVE(3): 연속 3봉 true 후 buy=true, 도중 false 있으면 false", () => {
    // threshold(<70) series: [F, T, T, T, T, T] (75→false, 65→true)
    // CONSECUTIVE(3) should be true only from barIdx=3 onward
    const barCount = 6;
    const num = makeNode("num", "PRICE", { field: "close" });
    const thr = makeNode("thr", "THRESHOLD", { operator: "<", value: 70 }, "condition");
    const consec = makeNode("consec", "CONSECUTIVE", { count: 3 }, "condition");
    const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");

    const nodes = [num, thr, consec, buy];
    const edges = [
      makeEdge("e1", "num", "thr", { targetHandle: "value" }),
      makeEdge("e2", "thr", "consec"),
      makeEdge("e3", "consec", "buy", { targetHandle: "signal" }),
    ];
    // numSeries[0]=75 → threshold=false, rest=65 → true
    const indicatorMap = new Map<string, IndicatorSeries>([
      ["num", [75, 65, 65, 65, 65, 65]],
    ]);

    const signals = evaluateStrategy(nodes, edges, indicatorMap, barCount);
    // barIdx=0: j=[-2,-1,0] → j=-2 null → false
    // barIdx=1: j=[-1,0,1]  → j=-1 null → false
    // barIdx=2: j=[0,1,2]   → [F,T,T] → false (j=0 threshold=false)
    // barIdx=3: j=[1,2,3]   → [T,T,T] → true
    expect(signals[0].buy).toBe(false);
    expect(signals[1].buy).toBe(false);
    expect(signals[2].buy).toBe(false);
    expect(signals[3].buy).toBe(true);
    expect(signals[4].buy).toBe(true);
    expect(signals[5].buy).toBe(true);
  });

  it("LOOKBACK(1): barIdx=0은 null(이전 봉 없음)→false, barIdx=1은 이전 값 참조", () => {
    // numSeries = [10, 5, 5, 5, 5]
    // LOOKBACK(1) at barIdx=0 → value[-1]=null → COMPARE null → false
    // LOOKBACK(1) at barIdx=1 → value[0]=10; current=5; 10>5 → true
    const barCount = 5;
    const num = makeNode("num", "PRICE", { field: "close" });
    const lb = makeNode("lb", "LOOKBACK", { period: 1 });
    const cmp = makeNode("cmp", "COMPARE", { operator: ">" }, "condition");
    const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");

    const nodes = [num, lb, cmp, buy];
    const edges = [
      makeEdge("e1", "num", "lb"),
      makeEdge("e2", "lb", "cmp", { targetHandle: "a" }),
      makeEdge("e3", "num", "cmp", { targetHandle: "b" }),
      makeEdge("e4", "cmp", "buy", { targetHandle: "signal" }),
    ];
    const indicatorMap = new Map<string, IndicatorSeries>([
      ["num", [10, 5, 5, 5, 5]],
    ]);

    const signals = evaluateStrategy(nodes, edges, indicatorMap, barCount);
    expect(signals[0].buy).toBe(false); // LOOKBACK null → compare false
    expect(signals[1].buy).toBe(true);  // 10 > 5 → true
    expect(signals[2].buy).toBe(false); // 5 > 5 → false (equal, not greater)
  });

  it("BUY 노드: 조건 true인 봉에서만 signals[i].buy = true", () => {
    const barCount = 3;
    const num = makeNode("num", "PRICE", { field: "close" });
    const thr = makeNode("thr", "THRESHOLD", { operator: ">", value: 50 }, "condition");
    const buy = makeNode("buy", "BUY", { positionSizePct: 100 }, "action");

    const nodes = [num, thr, buy];
    const edges = [
      makeEdge("e1", "num", "thr", { targetHandle: "value" }),
      makeEdge("e2", "thr", "buy", { targetHandle: "signal" }),
    ];
    const indicatorMap = new Map<string, IndicatorSeries>([
      ["num", [100, 30, 100]],
    ]);

    const signals = evaluateStrategy(nodes, edges, indicatorMap, barCount);
    expect(signals[0].buy).toBe(true);  // 100 > 50
    expect(signals[1].buy).toBe(false); // 30 > 50 → false
    expect(signals[2].buy).toBe(true);  // 100 > 50
  });
});
