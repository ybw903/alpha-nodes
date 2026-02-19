"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { clsx } from "clsx";
import type { StrategyNodeData, BlockCategory } from "@/types/strategy";

const CATEGORY_COLORS: Record<BlockCategory, string> = {
  indicator: "bg-[#818cf8]",
  condition: "bg-[#f59e0b]",
  action: "bg-[#22c55e]",
  logic: "bg-[#a78bfa]",
};

const CATEGORY_LABELS: Record<BlockCategory, string> = {
  indicator: "지표",
  condition: "조건",
  action: "액션",
  logic: "논리",
};

interface BaseNodeProps extends NodeProps {
  data: StrategyNodeData;
  inputs?: Array<{
    id: string;
    label: string;
    dataType: "NUMERIC" | "BOOLEAN";
  }>;
  outputs?: Array<{
    id: string;
    label: string;
    dataType: "NUMERIC" | "BOOLEAN";
  }>;
  children?: React.ReactNode;
}

export function BaseNode({
  data,
  selected,
  inputs = [],
  outputs = [],
  children,
}: BaseNodeProps) {
  const accentColor = CATEGORY_COLORS[data.category];

  return (
    <div
      className={clsx(
        "min-w-[160px] rounded-lg overflow-hidden",
        "border transition-all duration-150",
        selected
          ? "border-[var(--color-accent)] shadow-[0_0_0_1px_var(--color-accent)]"
          : "border-[var(--color-border-default)]",
        "bg-[var(--color-bg-elevated)]"
      )}
    >
      {/* Header */}
      <div className={clsx("px-3 py-1.5 flex items-center gap-2", accentColor)}>
        <span className="text-[10px] font-semibold text-white/70 uppercase tracking-wider">
          {CATEGORY_LABELS[data.category]}
        </span>
        <span className="text-xs font-bold text-white leading-none">
          {data.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2 text-xs text-[var(--color-text-secondary)]">
        {children}
      </div>

      {/* Input handles */}
      {inputs.map((input, i) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          style={{
            top: `${((i + 1) / (inputs.length + 1)) * 100}%`,
            background:
              input.dataType === "NUMERIC"
                ? "var(--color-handle-numeric)"
                : "var(--color-handle-boolean)",
            border: "2px solid var(--color-bg-base)",
            width: 10,
            height: 10,
          }}
          title={input.label}
        />
      ))}

      {/* Output handles */}
      {outputs.map((output, i) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          style={{
            top: `${((i + 1) / (outputs.length + 1)) * 100}%`,
            background:
              output.dataType === "NUMERIC"
                ? "var(--color-handle-numeric)"
                : "var(--color-handle-boolean)",
            border: "2px solid var(--color-bg-base)",
            width: 10,
            height: 10,
          }}
          title={output.label}
        />
      ))}
    </div>
  );
}
