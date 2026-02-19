import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { create } from "zustand";
import type { BlockParams, StrategyEdge, StrategyNode } from "@/types/strategy";

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
  clearCanvas: () => void;
  loadStrategy: (
    nodes: StrategyNode[],
    edges: StrategyEdge[],
    name: string
  ) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  selectedNodeId: null,
  strategyName: "새 전략",

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes) as StrategyNode[],
    })),

  onEdgesChange: (changes) =>
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges) as StrategyEdge[],
    })),

  onConnect: (connection) =>
    set((state) => ({
      edges: addEdge(connection, state.edges) as StrategyEdge[],
    })),

  addNode: (node) =>
    set((state) => ({
      nodes: [...state.nodes, node],
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
  clearCanvas: () => set({ nodes: [], edges: [], selectedNodeId: null }),

  loadStrategy: (nodes, edges, name) =>
    set({ nodes, edges, strategyName: name, selectedNodeId: null }),
}));
