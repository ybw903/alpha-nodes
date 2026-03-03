"use client";

import { BuilderToolbar } from "@/components/builder/BuilderToolbar";
import { BuilderSidebar } from "@/components/builder/BuilderSidebar";
import { BuilderCanvas } from "@/components/builder/BuilderCanvas";
import { NodeConfigPanel } from "@/components/builder/panels/NodeConfigPanel";
import { RunPanel } from "@/components/builder/panels/RunPanel";
import { useUIStore } from "@/lib/store/uiStore";
import { useTranslations } from "next-intl";

export default function HomePage() {
  const { rightPanelMode } = useUIStore();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--color-bg-base)]">
      {/* Top toolbar */}
      <BuilderToolbar />

      {/* Main area: sidebar + canvas + right panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: block palette */}
        <BuilderSidebar />

        {/* Center: ReactFlow canvas */}
        <BuilderCanvas />

        {/* Right: config / run panel */}
        <aside className="w-72 shrink-0 flex flex-col border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
          {/* Panel tab switcher */}
          <div className="flex border-b border-[var(--color-border-subtle)]">
            <PanelTab mode="config" />
            <PanelTab mode="run" />
          </div>

          <div className="flex-1 overflow-hidden">
            {rightPanelMode === "config" ? <NodeConfigPanel /> : <RunPanel />}
          </div>
        </aside>
      </div>
    </div>
  );
}

function PanelTab({ mode }: { mode: "config" | "run" }) {
  const t = useTranslations("builder");
  const { rightPanelMode, setRightPanelMode } = useUIStore();
  const active = rightPanelMode === mode;
  const label = mode === "config" ? t("panels.nodeConfig") : t("panels.run");

  return (
    <button
      onClick={() => setRightPanelMode(mode)}
      className={`flex-1 py-2 text-xs font-medium transition-colors ${
        active
          ? "text-[var(--color-text-primary)] border-b-2 border-[var(--color-accent)]"
          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
      }`}
    >
      {label}
    </button>
  );
}
