import type {
  StrategyNode,
  StrategyEdge,
  BlockType,
  CompareParams,
  ThresholdParams,
  ConsecutiveParams,
  LookbackParams,
} from '@/types/strategy';
import type { IndicatorSeries } from './indicators';

export interface BarSignals {
  buy: boolean;
  sell: boolean;
}

type NodeId = string;

/**
 * Topological sort of nodes (Kahn's algorithm).
 * Returns sorted node IDs or throws on cycle.
 */
export function topologicalSort(nodes: StrategyNode[], edges: StrategyEdge[]): NodeId[] {
  const inDegree = new Map<NodeId, number>();
  const adjList = new Map<NodeId, NodeId[]>();

  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  }

  for (const edge of edges) {
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    adjList.get(edge.source)?.push(edge.target);
  }

  const queue: NodeId[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: NodeId[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const neighbor of adjList.get(id) ?? []) {
      const deg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, deg);
      if (deg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('전략 그래프에 순환(cycle)이 감지되었습니다.');
  }

  return sorted;
}

/**
 * Evaluates conditions and actions for each bar index.
 * Uses a persistent cross-bar cache (allBarCache) keyed by `nodeId:barIndex`
 * to support CONSECUTIVE (N-bar lookback) and LOOKBACK (N bars ago) blocks.
 */
export function evaluateStrategy(
  nodes: StrategyNode[],
  edges: StrategyEdge[],
  indicatorMap: Map<NodeId, IndicatorSeries>,
  barCount: number
): BarSignals[] {
  const signals: BarSignals[] = Array.from({ length: barCount }, () => ({ buy: false, sell: false }));

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build input edge map: targetId -> list of edges
  const inputEdges = new Map<NodeId, StrategyEdge[]>();
  for (const edge of edges) {
    if (!inputEdges.has(edge.target)) inputEdges.set(edge.target, []);
    inputEdges.get(edge.target)!.push(edge);
  }

  // Cross-bar cache: key = `nodeId:barIndex`
  // Persists across bar iterations to enable CONSECUTIVE and LOOKBACK
  const allBarCache = new Map<string, number | boolean | null>();

  function resolveAtBar(nodeId: NodeId, barIdx: number): number | boolean | null {
    if (barIdx < 0) return null;

    const cacheKey = `${nodeId}:${barIdx}`;
    if (allBarCache.has(cacheKey)) return allBarCache.get(cacheKey)!;

    const node = nodeMap.get(nodeId);
    if (!node) return null;

    const blockType: BlockType = node.data.blockType;

    // Indicator nodes: value comes from pre-computed series
    if (['SMA', 'EMA', 'RSI', 'MACD', 'BOLLINGER', 'ATR', 'PRICE', 'VOLUME'].includes(blockType)) {
      const series = indicatorMap.get(nodeId);
      const val = series ? (series[barIdx] ?? null) : null;
      allBarCache.set(cacheKey, val);
      return val;
    }

    const incoming = inputEdges.get(nodeId) ?? [];

    function getInputByHandle(handle: string): number | boolean | null {
      const edge = incoming.find((e) => e.targetHandle === handle);
      if (!edge) return null;
      return resolveAtBar(edge.source, barIdx);
    }

    function getInputByIndex(idx: number): number | boolean | null {
      const edge = incoming[idx];
      if (!edge) return null;
      return resolveAtBar(edge.source, barIdx);
    }

    let value: number | boolean | null = null;

    switch (blockType) {
      case 'COMPARE': {
        const p = node.data.params as CompareParams;
        const a = (getInputByHandle('a') ?? getInputByIndex(0)) as number | null;
        const b = (getInputByHandle('b') ?? getInputByIndex(1)) as number | null;
        if (a === null || b === null) { value = null; break; }
        switch (p.operator) {
          case '>':  value = a > b; break;
          case '<':  value = a < b; break;
          case '>=': value = a >= b; break;
          case '<=': value = a <= b; break;
          case '==': value = Math.abs(a - b) < 1e-9; break;
          default:   value = false;
        }
        break;
      }
      case 'CROSSOVER': {
        if (barIdx === 0) { value = false; break; }
        const aCur = getInputByHandle('a') as number | null;
        const bCur = getInputByHandle('b') as number | null;
        const aEdge = incoming.find((e) => e.targetHandle === 'a');
        const bEdge = incoming.find((e) => e.targetHandle === 'b');
        const aPrev = aEdge ? resolveAtBar(aEdge.source, barIdx - 1) as number | null : null;
        const bPrev = bEdge ? resolveAtBar(bEdge.source, barIdx - 1) as number | null : null;
        if (aCur === null || bCur === null || aPrev === null || bPrev === null) { value = false; break; }
        value = aPrev <= bPrev && aCur > bCur;
        break;
      }
      case 'CROSSUNDER': {
        if (barIdx === 0) { value = false; break; }
        const aCur = getInputByHandle('a') as number | null;
        const bCur = getInputByHandle('b') as number | null;
        const aEdge = incoming.find((e) => e.targetHandle === 'a');
        const bEdge = incoming.find((e) => e.targetHandle === 'b');
        const aPrev = aEdge ? resolveAtBar(aEdge.source, barIdx - 1) as number | null : null;
        const bPrev = bEdge ? resolveAtBar(bEdge.source, barIdx - 1) as number | null : null;
        if (aCur === null || bCur === null || aPrev === null || bPrev === null) { value = false; break; }
        value = aPrev >= bPrev && aCur < bCur;
        break;
      }
      case 'THRESHOLD': {
        const p = node.data.params as ThresholdParams;
        const v = (getInputByHandle('value') ?? getInputByIndex(0)) as number | null;
        if (v === null) { value = null; break; }
        switch (p.operator) {
          case '>':  value = v > p.value; break;
          case '<':  value = v < p.value; break;
          case '>=': value = v >= p.value; break;
          case '<=': value = v <= p.value; break;
          case '==': value = Math.abs(v - p.value) < 1e-9; break;
          default:   value = false;
        }
        break;
      }
      case 'AND': {
        const a = (getInputByHandle('a') ?? getInputByIndex(0)) as boolean | null;
        const b = (getInputByHandle('b') ?? getInputByIndex(1)) as boolean | null;
        value = !!a && !!b;
        break;
      }
      case 'OR': {
        const a = (getInputByHandle('a') ?? getInputByIndex(0)) as boolean | null;
        const b = (getInputByHandle('b') ?? getInputByIndex(1)) as boolean | null;
        value = !!a || !!b;
        break;
      }
      case 'NOT': {
        // Boolean negation: NOT(true) = false, NOT(false) = true, NOT(null) = null
        const a = (getInputByHandle('a') ?? getInputByIndex(0)) as boolean | null;
        value = a !== null ? !a : null;
        break;
      }
      case 'CONSECUTIVE': {
        // Returns true if the input was true for `count` consecutive bars ending at barIdx
        const p = node.data.params as ConsecutiveParams;
        const count = Math.max(1, p?.count ?? 3);
        const inputEdge = (inputEdges.get(nodeId) ?? [])[0];
        if (!inputEdge) { value = false; break; }
        let allTrue = true;
        for (let j = barIdx - count + 1; j <= barIdx; j++) {
          if (!resolveAtBar(inputEdge.source, j)) {
            allTrue = false;
            break;
          }
        }
        value = allTrue;
        break;
      }
      case 'LOOKBACK': {
        // Returns the input node's value from `period` bars ago
        const p = node.data.params as LookbackParams;
        const period = Math.max(1, p?.period ?? 1);
        const inputEdge = (inputEdges.get(nodeId) ?? [])[0];
        if (!inputEdge) { value = null; break; }
        value = resolveAtBar(inputEdge.source, barIdx - period);
        break;
      }
      case 'BUY': {
        const sig = (getInputByHandle('signal') ?? getInputByIndex(0)) as boolean | null;
        if (sig) signals[barIdx].buy = true;
        value = sig ?? false;
        break;
      }
      case 'SELL': {
        const sig = (getInputByHandle('signal') ?? getInputByIndex(0)) as boolean | null;
        if (sig) signals[barIdx].sell = true;
        value = sig ?? false;
        break;
      }
      default:
        value = null;
    }

    allBarCache.set(cacheKey, value);
    return value;
  }

  // Resolve all action nodes for each bar (they set signals as side effect)
  for (let i = 0; i < barCount; i++) {
    for (const node of nodes) {
      if (node.data.blockType === 'BUY' || node.data.blockType === 'SELL') {
        resolveAtBar(node.id, i);
      }
    }
  }

  return signals;
}
