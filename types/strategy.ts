import { Node } from "@xyflow/react";

export type NodeId = string;
export type EdgeId = string;
export type StrategyId = string;

export type HandleDataType = "NUMERIC" | "BOOLEAN";
export type AssetClass = "US_STOCK" | "KR_STOCK" | "CRYPTO";
export type Timeframe = "1d" | "1w" | "1m";
export type PriceSource = "open" | "high" | "low" | "close" | "volume";
export type MACDOutput = "macd" | "signal" | "histogram";
export type BollingerOutput = "upper" | "middle" | "lower";
export type CompareOperator = ">" | "<" | ">=" | "<=" | "==";
export type StochasticOutput = "k" | "d";

// ─── Block types ──────────────────────────────────────────────────────
export type BlockCategory = "indicator" | "condition" | "action" | "logic";

export type BlockType =
  | "SMA"
  | "EMA"
  | "RSI"
  | "MACD"
  | "BOLLINGER"
  | "ATR"
  | "PRICE"
  | "VOLUME"
  | "COMPARE"
  | "CROSSOVER"
  | "CROSSUNDER"
  | "THRESHOLD"
  | "AND"
  | "OR"
  | "BUY"
  | "SELL";

// ─── Block params ─────────────────────────────────────────────────────
export interface SMAParams {
  period: number;
  source: PriceSource;
}
export interface EMAParams {
  period: number;
  source: PriceSource;
}
export interface RSIParams {
  period: number;
  source: PriceSource;
}
export interface MACDParams {
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  output: MACDOutput;
}
export interface BollingerParams {
  period: number;
  stdDev: number;
  output: BollingerOutput;
}
export interface ATRParams {
  period: number;
}
export interface PriceParams {
  field: PriceSource;
}
export interface VolumeParams {
  type: "raw";
}

export interface CompareParams {
  operator: CompareOperator;
}
export interface CrossoverParams {
  direction: "above" | "below";
}
export interface ThresholdParams {
  operator: CompareOperator;
  value: number;
}
export type AndParams = Record<string, never>;
export type OrParams = Record<string, never>;

export interface BuyParams {
  positionSizePct: number;
}
export interface SellParams {
  positionSizePct: number;
  stopLossPct?: number;
  takeProfitPct?: number;
}

export type BlockParams =
  | SMAParams
  | EMAParams
  | RSIParams
  | MACDParams
  | BollingerParams
  | ATRParams
  | PriceParams
  | VolumeParams
  | CompareParams
  | CrossoverParams
  | ThresholdParams
  | AndParams
  | OrParams
  | BuyParams
  | SellParams;

// ─── Node data (carried in ReactFlow node.data) ───────────────────────
export interface StrategyNodeData extends Record<string, unknown> {
  blockType: BlockType;
  category: BlockCategory;
  label: string;
  params: BlockParams;
}

// ─── ReactFlow-compatible node ────────────────────────────────────────
export type StrategyNode = Node<StrategyNodeData>;

// ─── ReactFlow-compatible edge ────────────────────────────────────────
export interface StrategyEdge {
  id: EdgeId;
  source: NodeId;
  sourceHandle: string | null;
  target: NodeId;
  targetHandle: string | null;
}

// ─── Strategy metadata ────────────────────────────────────────────────
export interface StrategyMeta {
  id: StrategyId;
  name: string;
  assetClass: AssetClass;
  symbol: string;
  timeframe: Timeframe;
  createdAt: string;
  updatedAt: string;
}

// ─── Full strategy ────────────────────────────────────────────────────
export interface Strategy {
  meta: StrategyMeta;
  nodes: StrategyNode[];
  edges: StrategyEdge[];
  viewport: { x: number; y: number; zoom: number };
}
