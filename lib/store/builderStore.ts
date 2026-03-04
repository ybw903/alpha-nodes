import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import type {
  AssetClass,
  BlockParams,
  StrategyEdge,
  StrategyNode,
  Timeframe,
} from "@/types/strategy";

export interface RunConfig {
  assetClass: AssetClass;
  timeframe: Timeframe;
  symbol: string;
  from: string;
  to: string;
  initialCapital: number;
  feeRatePct: number;
  slippagePct: number;
}

function getDefaultDate(offsetYears: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + offsetYears);
  return d.toISOString().split("T")[0];
}

const DEFAULT_RUN_CONFIG: RunConfig = {
  assetClass: "STOCK",
  timeframe: "1d",
  symbol: "",
  from: getDefaultDate(-2),
  to: getDefaultDate(0),
  initialCapital: 10_000_000,
  feeRatePct: 0.05,
  slippagePct: 0.05,
};

let nodeIdCounter = 1;

export function generateNodeId(): string {
  return `node_${Date.now()}_${nodeIdCounter++}`;
}

interface BuilderState {
  nodes: StrategyNode[];
  edges: StrategyEdge[];
  viewport: { x: number; y: number; zoom: number };
  selectedNodeId: string | null;
  strategyName: string;
  runConfig: RunConfig;
  clipboard: StrategyNode[];
  pasteOffset: number;
  history: Array<{ nodes: StrategyNode[]; edges: StrategyEdge[] }>;

  // Actions
  setNodes: (nodes: StrategyNode[]) => void;
  setEdges: (edges: StrategyEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: StrategyNode) => void;
  updateNodeParams: (nodeId: string, params: BlockParams) => void;
  setSelectedNodeId: (id: string | null) => void;
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  setStrategyName: (name: string) => void;
  patchRunConfig: (patch: Partial<RunConfig>) => void;
  clearCanvas: () => void;
  loadStrategy: (
    nodes: StrategyNode[],
    edges: StrategyEdge[],
    name: string
  ) => void;
  copySelectedNodes: () => void;
  pasteNodes: () => void;
  undo: () => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,
  strategyName: "새 전략",
  runConfig: DEFAULT_RUN_CONFIG,
  clipboard: [],
  pasteOffset: 0,
  history: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((state) => {
      const hasChange = changes.some(
        (c) => c.type === "remove" || c.type === "add"
      );
      const history = hasChange
        ? [...state.history, { nodes: state.nodes, edges: state.edges }].slice(
            -20
          )
        : state.history;
      return {
        nodes: applyNodeChanges(changes, state.nodes) as StrategyNode[],
        history,
      };
    }),

  onEdgesChange: (changes) =>
    set((state) => {
      const hasChange = changes.some(
        (c) => c.type === "remove" || c.type === "add"
      );
      const history = hasChange
        ? [...state.history, { nodes: state.nodes, edges: state.edges }].slice(
            -20
          )
        : state.history;
      return {
        edges: applyEdgeChanges(changes, state.edges) as StrategyEdge[],
        history,
      };
    }),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges) as StrategyEdge[],
      history: [
        ...state.history,
        { nodes: state.nodes, edges: state.edges },
      ].slice(-20),
    })),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
      history: [
        ...state.history,
        { nodes: state.nodes, edges: state.edges },
      ].slice(-20),
    })),

  updateNodeParams: (nodeId, params) =>
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                params: { ...node.data.params, ...params },
              },
            }
          : node
      ),
    })),

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setViewport: (viewport) => set({ viewport }),
  setStrategyName: (name) => set({ strategyName: name }),
  patchRunConfig: (patch) =>
    set((state) => ({ runConfig: { ...state.runConfig, ...patch } })),
  clearCanvas: () => set({ nodes: [], edges: [], selectedNodeId: null }),

  loadStrategy: (nodes, edges, name) =>
    set({ nodes, edges, strategyName: name, selectedNodeId: null }),

  copySelectedNodes: () =>
    set((state) => ({
      clipboard: state.nodes.filter((n) => n.selected),
      pasteOffset: 0,
    })),

  pasteNodes: () =>
    set((state) => {
      if (state.clipboard.length === 0) return {};
      const offset = (state.pasteOffset + 1) * 20;
      const pasted = state.clipboard.map((n) => ({
        ...n,
        id: generateNodeId(),
        position: { x: n.position.x + offset, y: n.position.y + offset },
        selected: true,
      }));
      return {
        nodes: [
          ...state.nodes.map((n) => ({ ...n, selected: false })),
          ...pasted,
        ] as StrategyNode[],
        pasteOffset: state.pasteOffset + 1,
        history: [
          ...state.history,
          { nodes: state.nodes, edges: state.edges },
        ].slice(-20),
      };
    }),

  undo: () =>
    set((state) => {
      if (state.history.length === 0) return {};
      const prev = state.history[state.history.length - 1];
      return {
        nodes: prev.nodes,
        edges: prev.edges,
        history: state.history.slice(0, -1),
        selectedNodeId: null,
      };
    }),
}));
