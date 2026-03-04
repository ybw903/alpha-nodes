import { describe, it, expect, beforeEach, vi } from "vitest";

import { useBuilderStore } from "@/lib/store/builderStore";
import type { StrategyNode, StrategyEdge } from "@/types/strategy";

// @xyflow/react의 순수 유틸리티 함수를 node 환경에서 실행 가능하도록 모킹
vi.mock("@xyflow/react", () => ({
  applyNodeChanges: (
    changes: Array<{ type: string; id?: string; item?: unknown }>,
    nodes: unknown[]
  ) => {
    return changes.reduce((acc: unknown[], change) => {
      if (change.type === "remove")
        return (acc as { id: string }[]).filter((n) => n.id !== change.id);
      if (change.type === "add") return [...acc, change.item];
      return acc;
    }, nodes);
  },
  applyEdgeChanges: (
    changes: Array<{ type: string; id?: string; item?: unknown }>,
    edges: unknown[]
  ) => {
    return changes.reduce((acc: unknown[], change) => {
      if (change.type === "remove")
        return (acc as { id: string }[]).filter((e) => e.id !== change.id);
      if (change.type === "add") return [...acc, change.item];
      return acc;
    }, edges);
  },
  addEdge: (connection: Record<string, unknown>, edges: unknown[]) => {
    return [
      ...edges,
      { id: `edge-${connection.source}-${connection.target}`, ...connection },
    ];
  },
  create: vi.fn(),
}));

function makeNode(id: string, x = 0, y = 0, selected = false): StrategyNode {
  return {
    id,
    type: "indicatorNode",
    position: { x, y },
    selected,
    data: {
      blockType: "SMA",
      category: "indicator",
      label: "SMA",
      params: { period: 20, source: "close" },
    },
  };
}

function makeEdge(id: string, source: string, target: string): StrategyEdge {
  return { id, source, target, sourceHandle: null, targetHandle: null };
}

const RESET_STATE = {
  nodes: [] as StrategyNode[],
  edges: [] as StrategyEdge[],
  clipboard: [] as StrategyNode[],
  pasteOffset: 0,
  history: [] as Array<{ nodes: StrategyNode[]; edges: StrategyEdge[] }>,
  selectedNodeId: null,
};

beforeEach(() => {
  // replace:false(기본값)로 데이터 속성만 병합 — 액션 메서드는 유지
  useBuilderStore.setState(RESET_STATE);
});

// ─── copySelectedNodes ──────────────────────────────────────────────────────

describe("copySelectedNodes", () => {
  it("선택된 노드만 clipboard에 저장", () => {
    useBuilderStore.setState({
      nodes: [makeNode("a", 0, 0, true), makeNode("b", 100, 0, false)],
    });
    useBuilderStore.getState().copySelectedNodes();
    const { clipboard } = useBuilderStore.getState();
    expect(clipboard).toHaveLength(1);
    expect(clipboard[0].id).toBe("a");
  });

  it("선택된 노드 없으면 clipboard가 빈 배열", () => {
    useBuilderStore.setState({
      nodes: [makeNode("a", 0, 0, false)],
      clipboard: [makeNode("old")],
    });
    useBuilderStore.getState().copySelectedNodes();
    expect(useBuilderStore.getState().clipboard).toHaveLength(0);
  });

  it("pasteOffset을 0으로 초기화", () => {
    useBuilderStore.setState({ pasteOffset: 5 });
    useBuilderStore.getState().copySelectedNodes();
    expect(useBuilderStore.getState().pasteOffset).toBe(0);
  });

  it("여러 노드 선택 시 전부 clipboard에 저장", () => {
    useBuilderStore.setState({
      nodes: [
        makeNode("a", 0, 0, true),
        makeNode("b", 100, 0, true),
        makeNode("c", 200, 0, false),
      ],
    });
    useBuilderStore.getState().copySelectedNodes();
    expect(useBuilderStore.getState().clipboard).toHaveLength(2);
  });
});

// ─── pasteNodes ─────────────────────────────────────────────────────────────

describe("pasteNodes", () => {
  it("clipboard가 비어있으면 아무 변화 없음", () => {
    useBuilderStore.setState({ nodes: [makeNode("a")], clipboard: [] });
    useBuilderStore.getState().pasteNodes();
    expect(useBuilderStore.getState().nodes).toHaveLength(1);
  });

  it("첫 번째 붙여넣기: 원본 위치 + 20 offset 적용", () => {
    useBuilderStore.setState({
      clipboard: [makeNode("src", 100, 100)],
      pasteOffset: 0,
    });
    useBuilderStore.getState().pasteNodes();
    const pasted = useBuilderStore.getState().nodes[0];
    expect(pasted.position).toEqual({ x: 120, y: 120 });
  });

  it("두 번째 붙여넣기: 원본 위치 + 40 offset 적용", () => {
    useBuilderStore.setState({
      clipboard: [makeNode("src", 100, 100)],
      pasteOffset: 1,
    });
    useBuilderStore.getState().pasteNodes();
    const pasted = useBuilderStore.getState().nodes[0];
    expect(pasted.position).toEqual({ x: 140, y: 140 });
  });

  it("붙여넣기 할 때마다 pasteOffset 1 증가", () => {
    useBuilderStore.setState({ clipboard: [makeNode("src")], pasteOffset: 0 });
    useBuilderStore.getState().pasteNodes();
    expect(useBuilderStore.getState().pasteOffset).toBe(1);
    useBuilderStore.getState().pasteNodes();
    expect(useBuilderStore.getState().pasteOffset).toBe(2);
    useBuilderStore.getState().pasteNodes();
    expect(useBuilderStore.getState().pasteOffset).toBe(3);
  });

  it("붙여넣어진 노드는 clipboard 원본과 다른 id 생성", () => {
    useBuilderStore.setState({ clipboard: [makeNode("original-id")] });
    useBuilderStore.getState().pasteNodes();
    const pastedId = useBuilderStore.getState().nodes[0].id;
    expect(pastedId).not.toBe("original-id");
  });

  it("기존 노드 selected 해제, 붙여넣어진 노드 selected=true", () => {
    useBuilderStore.setState({
      nodes: [makeNode("existing", 0, 0, true)],
      clipboard: [makeNode("src", 50, 50)],
    });
    useBuilderStore.getState().pasteNodes();
    const state = useBuilderStore.getState();
    expect(state.nodes.find((n) => n.id === "existing")?.selected).toBe(false);
    const pasted = state.nodes.find((n) => n.id !== "existing")!;
    expect(pasted.selected).toBe(true);
  });

  it("붙여넣기 직전 상태를 history에 저장", () => {
    useBuilderStore.setState({
      nodes: [makeNode("a")],
      edges: [makeEdge("e1", "a", "b")],
      clipboard: [makeNode("src")],
      history: [],
    });
    useBuilderStore.getState().pasteNodes();
    const { history } = useBuilderStore.getState();
    expect(history).toHaveLength(1);
    expect(history[0].nodes).toHaveLength(1);
    expect(history[0].edges).toHaveLength(1);
  });

  it("여러 번 붙여넣기 시 위치가 점진적으로 이동", () => {
    useBuilderStore.setState({
      clipboard: [makeNode("src", 0, 0)],
      pasteOffset: 0,
    });
    useBuilderStore.getState().pasteNodes(); // offset +20
    useBuilderStore.getState().pasteNodes(); // offset +40
    useBuilderStore.getState().pasteNodes(); // offset +60
    const nodes = useBuilderStore.getState().nodes;
    const positions = nodes.map((n) => n.position.x);
    expect(positions).toContain(20);
    expect(positions).toContain(40);
    expect(positions).toContain(60);
  });
});

// ─── undo ───────────────────────────────────────────────────────────────────

describe("undo", () => {
  it("history가 비어있으면 아무 변화 없음", () => {
    useBuilderStore.setState({ nodes: [makeNode("a")], history: [] });
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().nodes).toHaveLength(1);
  });

  it("노드 추가(addNode) 후 undo → 노드 제거", () => {
    useBuilderStore.setState({ nodes: [], edges: [], history: [] });
    useBuilderStore.getState().addNode(makeNode("a"));
    expect(useBuilderStore.getState().nodes).toHaveLength(1);
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().nodes).toHaveLength(0);
  });

  it("노드 삭제(onNodesChange remove) 후 undo → 노드 복원", () => {
    useBuilderStore.setState({
      nodes: [makeNode("a")],
      edges: [],
      history: [],
    });
    useBuilderStore.getState().onNodesChange([{ type: "remove", id: "a" }]);
    expect(useBuilderStore.getState().nodes).toHaveLength(0);
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().nodes).toHaveLength(1);
    expect(useBuilderStore.getState().nodes[0].id).toBe("a");
  });

  it("엣지 연결(onConnect) 후 undo → 엣지 제거", () => {
    useBuilderStore.setState({
      nodes: [makeNode("a"), makeNode("b")],
      edges: [],
      history: [],
    });
    useBuilderStore.getState().onConnect({
      source: "a",
      target: "b",
      sourceHandle: null,
      targetHandle: null,
    });
    expect(useBuilderStore.getState().edges).toHaveLength(1);
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().edges).toHaveLength(0);
  });

  it("엣지 삭제(onEdgesChange remove) 후 undo → 엣지 복원", () => {
    useBuilderStore.setState({
      nodes: [makeNode("a"), makeNode("b")],
      edges: [makeEdge("e1", "a", "b")],
      history: [],
    });
    useBuilderStore.getState().onEdgesChange([{ type: "remove", id: "e1" }]);
    expect(useBuilderStore.getState().edges).toHaveLength(0);
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().edges).toHaveLength(1);
  });

  it("A-B 엣지 연결 후 A 복사, A' 붙여넣기, undo → A'만 제거되고 엣지 유지", () => {
    // A(selected), B 노드 + 빈 엣지로 시작
    useBuilderStore.setState({
      nodes: [makeNode("a", 0, 0, true), makeNode("b", 200, 0)],
      edges: [],
      history: [],
    });

    // A→B 엣지 연결
    useBuilderStore.getState().onConnect({
      source: "a",
      target: "b",
      sourceHandle: null,
      targetHandle: null,
    });
    expect(useBuilderStore.getState().edges).toHaveLength(1);

    // A 복사 (이미 selected=true)
    useBuilderStore.getState().copySelectedNodes();
    expect(useBuilderStore.getState().clipboard).toHaveLength(1);

    // A' 붙여넣기
    useBuilderStore.getState().pasteNodes();
    expect(useBuilderStore.getState().nodes).toHaveLength(3); // a, b, a'

    // undo → A'만 제거, 엣지 유지
    useBuilderStore.getState().undo();
    const state = useBuilderStore.getState();
    expect(state.nodes).toHaveLength(2);
    expect(state.nodes.map((n) => n.id)).toContain("a");
    expect(state.nodes.map((n) => n.id)).toContain("b");
    expect(state.edges).toHaveLength(1);
  });

  it("여러 번 붙여넣기 후 undo는 한 번에 하나씩 제거", () => {
    useBuilderStore.setState({
      nodes: [makeNode("origin", 0, 0)],
      edges: [],
      clipboard: [makeNode("src", 0, 0)],
      pasteOffset: 0,
      history: [],
    });

    // 3번 붙여넣기
    useBuilderStore.getState().pasteNodes();
    useBuilderStore.getState().pasteNodes();
    useBuilderStore.getState().pasteNodes();
    expect(useBuilderStore.getState().nodes).toHaveLength(4);

    // undo 3번 → 한 번에 하나씩 제거
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().nodes).toHaveLength(3);
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().nodes).toHaveLength(2);
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().nodes).toHaveLength(1);
  });

  it("undo 후 selectedNodeId null로 초기화", () => {
    useBuilderStore.setState({
      nodes: [makeNode("a")],
      edges: [],
      history: [{ nodes: [], edges: [] }],
      selectedNodeId: "a",
    });
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().selectedNodeId).toBeNull();
  });

  it("undo 후 history 스택에서 해당 항목 제거", () => {
    useBuilderStore.setState({
      nodes: [makeNode("b")],
      edges: [],
      history: [
        { nodes: [], edges: [] },
        { nodes: [makeNode("a")], edges: [] },
      ],
    });
    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().history).toHaveLength(1);
  });
});
