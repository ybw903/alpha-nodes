'use client';

import { useState, useRef, useEffect } from 'react';
import { useBuilderStore } from '@/lib/store/builderStore';
import { useModal } from '@/hooks/useModal';
import { PromptContent } from '@/components/ui/Modal';
import type { Strategy } from '@/types/strategy';

const MAX_STRATEGIES = 5;

function readSaved(): Strategy[] {
  return JSON.parse(localStorage.getItem('strategies') || '[]') as Strategy[];
}

function writeSaved(list: Strategy[]): void {
  localStorage.setItem('strategies', JSON.stringify(list));
}

export function BuilderToolbar() {
  const { nodes, edges, viewport, strategyName, setStrategyName, loadStrategy, clearCanvas } =
    useBuilderStore();
  const { openModal, showAlert, showConfirm } = useModal();
  const [loadOpen, setLoadOpen] = useState(false);
  const [savedList, setSavedList] = useState<Strategy[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // localStorage에 마지막으로 저장·불러온 이름 (input 직접 변경과 구분하기 위해 별도 관리)
  const [persistedName, setPersistedName] = useState<string | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setLoadOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSave = async () => {
    const inputName = await openModal<string | null>({
      title: '전략 저장',
      defaultCloseValue: null,
      renderContent: (close) => (
        <PromptContent
          message="저장할 전략 이름을 입력하세요"
          defaultValue={strategyName}
          onConfirm={close}
          onCancel={() => close(null)}
        />
      ),
    });
    if (inputName === null) return;
    const trimmed = inputName.trim();
    if (!trimmed) {
      await showAlert('전략 이름을 입력해주세요.');
      return;
    }

    const saved = readSaved();
    const existingIdx = saved.findIndex((s) => s.meta.name === trimmed);
    // persistedName: 현재 캔버스가 저장된 이름 (input을 통한 변경은 반영 안 됨)
    const oldIdx = persistedName ? saved.findIndex((s) => s.meta.name === persistedName) : -1;
    const isRenaming = oldIdx >= 0 && trimmed !== persistedName;

    // 새 항목 추가 시 저장 한도 확인 (이름 변경은 기존 항목이 제거되므로 제외)
    if (existingIdx < 0 && !isRenaming && saved.length >= MAX_STRATEGIES) {
      await showAlert(
        `전략은 최대 ${MAX_STRATEGIES}개까지 저장할 수 있습니다.\n불러오기 메뉴에서 기존 전략을 삭제한 후 다시 시도해주세요.`,
      );
      return;
    }

    // 동일 이름 전략 덮어쓰기 확인 (자기 자신 제외)
    if (existingIdx >= 0 && existingIdx !== oldIdx) {
      const ok = await showConfirm(`'${trimmed}' 전략이 이미 존재합니다. 덮어쓰시겠습니까?`);
      if (!ok) return;
    }

    const now = new Date().toISOString();
    const baseEntry = existingIdx >= 0 ? saved[existingIdx] : isRenaming ? saved[oldIdx] : null;
    const strategy: Strategy = {
      meta: {
        id: baseEntry?.meta.id ?? `strategy_${Date.now()}`,
        name: trimmed,
        assetClass: 'STOCK',
        symbol: '',
        timeframe: '1d',
        createdAt: baseEntry?.meta.createdAt ?? now,
        updatedAt: now,
      },
      nodes,
      edges,
      viewport,
    };

    // 덮어쓸 대상 제거 + 이름 변경 시 기존 항목 제거 후 새 항목 추가
    const newSaved = saved.filter((s) => {
      if (s.meta.name === trimmed) return false;
      if (isRenaming && s.meta.name === persistedName) return false;
      return true;
    });
    newSaved.push(strategy);

    writeSaved(newSaved);
    setStrategyName(trimmed);
    setPersistedName(trimmed); // 저장 후 persistedName 갱신
    await showAlert('전략이 저장되었습니다.');
  };

  const handleOpenLoad = () => {
    setSavedList(readSaved());
    setLoadOpen((prev) => !prev);
  };

  const handleLoad = (strategy: Strategy) => {
    loadStrategy(strategy.nodes, strategy.edges, strategy.meta.name);
    setPersistedName(strategy.meta.name); // 불러온 전략의 이름을 persistedName으로 설정
    setLoadOpen(false);
  };

  const handleDelete = async (name: string) => {
    const ok = await showConfirm(`'${name}' 전략을 삭제하시겠습니까?`, undefined, {
      isDanger: true,
    });
    if (!ok) return;
    const newSaved = readSaved().filter((s) => s.meta.name !== name);
    writeSaved(newSaved);
    setSavedList(newSaved);
    // 현재 편집 중인 전략이 삭제된 경우 persistedName 초기화
    if (name === persistedName) setPersistedName(null);
  };

  const handleNew = async () => {
    if (nodes.length > 0) {
      const ok = await showConfirm(
        '현재 캔버스를 비우고 새 전략을 시작하시겠습니까?\n저장되지 않은 변경사항은 사라집니다.',
        undefined,
        { isDanger: true },
      );
      if (!ok) return;
    }
    clearCanvas();
    setStrategyName('새 전략');
    setPersistedName(null);
  };

  const atLimit = savedList.length >= MAX_STRATEGIES;

  return (
    <header className="h-13 flex shrink-0 items-center gap-3 border-b border-(--color-border-subtle) bg-(--color-bg-surface) px-4">
      {/* Logo */}
      <span className="mr-2 text-sm font-bold text-(--color-accent)">BacktestApp</span>

      {/* Strategy name */}
      <input
        type="text"
        value={strategyName}
        onChange={(e) => setStrategyName(e.target.value)}
        className="max-w-xs flex-1 border-b border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-foreground transition-colors focus:border-(--color-border-default) focus:outline-none"
        placeholder="전략 이름"
      />

      <div className="flex-1" />

      {/* Action buttons */}
      <button
        onClick={handleNew}
        className="px-3 py-1.5 text-xs font-medium rounded-md border border-(--color-border-default) text-(--color-text-secondary) hover:text-foreground hover:border-(--color-border-strong) transition-colors"
      >
        새 전략
      </button>

      <div ref={dropdownRef} className="relative">
        <button
          onClick={handleOpenLoad}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-(--color-border-default) text-(--color-text-secondary) hover:text-foreground hover:border-(--color-border-strong) transition-colors"
        >
          불러오기
        </button>

        {loadOpen && (
          <div className="absolute right-0 top-full mt-1 w-64 rounded-md border border-(--color-border-default) bg-(--color-bg-surface) shadow-xl z-50 overflow-hidden">
            {savedList.length === 0 ? (
              <p className="px-3 py-2.5 text-[11px] text-(--color-text-muted) text-center">
                저장된 전략이 없습니다
              </p>
            ) : (
              <ul>
                {savedList.map((s) => (
                  <li
                    key={s.meta.id}
                    className="flex items-center group border-b border-(--color-border-subtle) last:border-0"
                  >
                    <button
                      type="button"
                      onMouseDown={() => handleLoad(s)}
                      className="flex-1 px-3 py-2 text-left text-xs text-foreground hover:bg-(--color-bg-elevated) transition-colors truncate"
                    >
                      {s.meta.name}
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleDelete(s.meta.name);
                      }}
                      className="px-2.5 py-2 text-[13px] leading-none text-(--color-text-muted) hover:text-(--color-danger) transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                      title="삭제"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* 저장 한도 표시 */}
            <div
              className={`px-3 py-1.5 flex items-center justify-between border-t border-(--color-border-subtle) ${atLimit ? 'bg-(--color-danger)/10' : ''}`}
            >
              <span
                className={`text-[10px] font-medium ${atLimit ? 'text-(--color-danger)' : 'text-(--color-text-muted)'}`}
              >
                {atLimit ? '저장 한도에 도달했습니다' : '저장된 전략'}
              </span>
              <span
                className={`text-[10px] font-mono font-semibold ${atLimit ? 'text-(--color-danger)' : 'text-(--color-text-muted)'}`}
              >
                {savedList.length} / {MAX_STRATEGIES}
              </span>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        className="px-3 py-1.5 text-xs font-medium rounded-md border border-(--color-border-default) text-(--color-text-secondary) hover:text-foreground hover:border-(--color-border-strong) transition-colors"
      >
        저장
      </button>
    </header>
  );
}
