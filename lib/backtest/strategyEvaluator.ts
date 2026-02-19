import type { StrategyNode, StrategyEdge, BlockType, CompareParams, ThresholdParams } from '@/types/strategy';
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
 * Returns an array of BarSignals (buy/sell).
 */
export function evaluateStrategy(
  nodes: StrategyNode[],
  edges: StrategyEdge[],
  indicatorMap: Map<NodeId, IndicatorSeries>,
  barCount: number
): BarSignals[] {
  const signals: BarSignals[] = Array.from({ length: barCount }, () => ({ buy: false, sell: false }));

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Build input edge map: targetId -> list of { source, sourceHandle, targetHandle }
  const inputEdges = new Map<NodeId, StrategyEdge[]>();
  for (const edge of edges) {
    if (!inputEdges.has(edge.target)) inputEdges.set(edge.target, []);
    inputEdges.get(edge.target)!.push(edge);
  }

  // For each bar, resolve node values
  for (let i = 0; i < barCount; i++) {
    // Cache resolved values for this bar
    const resolved = new Map<NodeId, number | boolean | null>();

    function resolveNode(nodeId: NodeId): number | boolean | null {
      if (resolved.has(nodeId)) return resolved.get(nodeId)!;

      const node = nodeMap.get(nodeId);
      if (!node) return null;

      const blockType: BlockType = node.data.blockType;

      // Indicator nodes: value comes from pre-computed series
      if (['SMA','EMA','RSI','MACD','BOLLINGER','ATR','PRICE','VOLUME'].includes(blockType)) {
        const series = indicatorMap.get(nodeId);
        const val = series ? (series[i] ?? null) : null;
        resolved.set(nodeId, val);
        return val;
      }

      // Get incoming edges for this node
      const incoming = inputEdges.get(nodeId) ?? [];

      function getInputByHandle(handle: string): number | boolean | null {
        const edge = incoming.find((e) => e.targetHandle === handle);
        if (!edge) return null;
        return resolveNode(edge.source);
      }

      function getInputByIndex(idx: number): number | boolean | null {
        const edge = incoming[idx];
        if (!edge) return null;
        return resolveNode(edge.source);
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
          if (i === 0) { value = false; break; }
          const aCur = getInputByHandle('a') as number | null;
          const bCur = getInputByHandle('b') as number | null;
          // resolve prev bar values manually
          const aPrevSeries = incoming.find((e) => e.targetHandle === 'a');
          const bPrevSeries = incoming.find((e) => e.targetHandle === 'b');
          const aPrev = aPrevSeries ? (indicatorMap.get(aPrevSeries.source)?.[i - 1] ?? null) : null;
          const bPrev = bPrevSeries ? (indicatorMap.get(bPrevSeries.source)?.[i - 1] ?? null) : null;
          if (aCur === null || bCur === null || aPrev === null || bPrev === null) { value = false; break; }
          value = (aPrev as number) <= (bPrev as number) && (aCur as number) > (bCur as number);
          break;
        }
        case 'CROSSUNDER': {
          if (i === 0) { value = false; break; }
          const aCur = getInputByHandle('a') as number | null;
          const bCur = getInputByHandle('b') as number | null;
          const aPrevSeries = incoming.find((e) => e.targetHandle === 'a');
          const bPrevSeries = incoming.find((e) => e.targetHandle === 'b');
          const aPrev = aPrevSeries ? (indicatorMap.get(aPrevSeries.source)?.[i - 1] ?? null) : null;
          const bPrev = bPrevSeries ? (indicatorMap.get(bPrevSeries.source)?.[i - 1] ?? null) : null;
          if (aCur === null || bCur === null || aPrev === null || bPrev === null) { value = false; break; }
          value = (aPrev as number) >= (bPrev as number) && (aCur as number) < (bCur as number);
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
        case 'BUY': {
          const sig = (getInputByHandle('signal') ?? getInputByIndex(0)) as boolean | null;
          if (sig) signals[i].buy = true;
          value = sig ?? false;
          break;
        }
        case 'SELL': {
          const sig = (getInputByHandle('signal') ?? getInputByIndex(0)) as boolean | null;
          if (sig) signals[i].sell = true;
          value = sig ?? false;
          break;
        }
        default:
          value = null;
      }

      resolved.set(nodeId, value);
      return value;
    }

    // Resolve all action nodes (they set signals as side effect)
    for (const node of nodes) {
      if (node.data.blockType === 'BUY' || node.data.blockType === 'SELL') {
        resolveNode(node.id);
      }
    }
  }

  return signals;
}
