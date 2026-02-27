"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useBuilderStore, generateNodeId } from "@/lib/store/builderStore";
import { useUIStore } from "@/lib/store/uiStore";
import { IndicatorNode } from "./nodes/IndicatorNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { ActionNode } from "./nodes/ActionNode";
import type {
  BlockType,
  BlockCategory,
  BlockParams,
  StrategyNode,
} from "@/types/strategy";

const INDICATOR_TYPES = new Set([
  "SMA",
  "EMA",
  "RSI",
  "MACD",
  "BOLLINGER",
  "ATR",
  "PRICE",
  "VOLUME",
  "LOOKBACK",
]);
const CONDITION_TYPES = new Set([
  "COMPARE",
  "CROSSOVER",
  "CROSSUNDER",
  "THRESHOLD",
  "AND",
  "OR",
  "NOT",
  "CONSECUTIVE",
]);
const ACTION_TYPES = new Set(["BUY", "SELL"]);

function getNodeCategory(blockType: BlockType): BlockCategory {
  if (INDICATOR_TYPES.has(blockType)) return "indicator";
  if (CONDITION_TYPES.has(blockType)) {
    if (blockType === "AND" || blockType === "OR" || blockType === "NOT") return "logic";
    return "condition";
  }
  if (ACTION_TYPES.has(blockType)) return "action";
  return "indicator";
}

function getReactFlowType(category: BlockCategory): string {
  if (category === "indicator") return "indicatorNode";
  if (category === "condition" || category === "logic") return "conditionNode";
  return "actionNode";
}

const nodeTypes: NodeTypes = {
  indicatorNode: IndicatorNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
};

export function BuilderCanvas() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodeId,
  } = useBuilderStore();
  const { setRightPanelMode } = useUIStore();

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      setSelectedNodeId(node.id);
      setRightPanelMode("config");
    },
    [setSelectedNodeId, setRightPanelMode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();

      const blockType = e.dataTransfer.getData(
        "application/reactflow-blocktype"
      ) as BlockType;
      const label = e.dataTransfer.getData("application/reactflow-label");
      const paramsJson = e.dataTransfer.getData("application/reactflow-params");

      if (!blockType || !wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const position = {
        x: e.clientX - rect.left - 80,
        y: e.clientY - rect.top - 30,
      };

      let params: BlockParams;
      try {
        params = JSON.parse(paramsJson) as BlockParams;
      } catch {
        params = {} as BlockParams;
      }

      const category = getNodeCategory(blockType);
      const nodeType = getReactFlowType(category);

      const newNode: StrategyNode = {
        id: generateNodeId(),
        type: nodeType,
        position,
        data: {
          blockType,
          category,
          label,
          params,
        },
      };

      addNode(newNode);
      setSelectedNodeId(newNode.id);
      setRightPanelMode("config");
    },
    [addNode, setSelectedNodeId, setRightPanelMode]
  );

  return (
    <div ref={wrapperRef} className="flex-1 relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        fitView
        className="bg-[var(--color-bg-base)]"
        defaultEdgeOptions={{
          style: { strokeWidth: 1.5, stroke: "var(--color-border-strong)" },
          animated: false,
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="var(--color-border-subtle)"
        />
        <Controls showInteractive={false} />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as { category?: BlockCategory };
            switch (data.category) {
              case "indicator":
                return "#818cf8";
              case "condition":
                return "#f59e0b";
              case "logic":
                return "#a78bfa";
              case "action":
                return "#22c55e";
              default:
                return "#5a5d6a";
            }
          }}
          maskColor="rgba(13,13,15,0.7)"
        />
      </ReactFlow>

      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-semibold text-[var(--color-text-muted)]">
              캔버스가 비어 있습니다
            </p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              왼쪽 팔레트에서 블록을 드래그하여 전략을 구성하세요
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
