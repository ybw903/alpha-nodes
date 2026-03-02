'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useBuilderStore } from '@/lib/store/builderStore';
import { useModal } from '@/hooks/useModal';
import { PromptContent } from '@/components/ui/Modal';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import type { Strategy } from '@/types/strategy';

const MAX_STRATEGIES = 5;

function readSaved(): Strategy[] {
  return JSON.parse(localStorage.getItem('strategies') || '[]') as Strategy[];
}

function writeSaved(list: Strategy[]): void {
  localStorage.setItem('strategies', JSON.stringify(list));
}

export function BuilderToolbar() {
  const t = useTranslations('builder');
  const tCommon = useTranslations('common');
  const { nodes, edges, viewport, strategyName, setStrategyName, loadStrategy, clearCanvas } =
    useBuilderStore();
  const { openModal, showAlert, showConfirm } = useModal();
  const [loadOpen, setLoadOpen] = useState(false);
  const [savedList, setSavedList] = useState<Strategy[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      title: t('toolbar.saveModal.title'),
      defaultCloseValue: null,
      renderContent: (close) => (
        <PromptContent
          message={t('toolbar.saveModal.message')}
          defaultValue={strategyName}
          onConfirm={close}
          onCancel={() => close(null)}
        />
      ),
    });
    if (inputName === null) return;
    const trimmed = inputName.trim();
    if (!trimmed) {
      await showAlert(tCommon('alert.strategyNameRequired'));
      return;
    }

    const saved = readSaved();
    const existingIdx = saved.findIndex((s) => s.meta.name === trimmed);
    const oldIdx = persistedName ? saved.findIndex((s) => s.meta.name === persistedName) : -1;
    const isRenaming = oldIdx >= 0 && trimmed !== persistedName;

    if (existingIdx < 0 && !isRenaming && saved.length >= MAX_STRATEGIES) {
      await showAlert(tCommon('alert.strategyLimitReached', { max: MAX_STRATEGIES }));
      return;
    }

    if (existingIdx >= 0 && existingIdx !== oldIdx) {
      const ok = await showConfirm(tCommon('confirmMsg.overwriteStrategy', { name: trimmed }));
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

    const newSaved = saved.filter((s) => {
      if (s.meta.name === trimmed) return false;
      if (isRenaming && s.meta.name === persistedName) return false;
      return true;
    });
    newSaved.push(strategy);

    writeSaved(newSaved);
    setStrategyName(trimmed);
    setPersistedName(trimmed);
    await showAlert(tCommon('alert.saved'));
  };

  const handleOpenLoad = () => {
    setSavedList(readSaved());
    setLoadOpen((prev) => !prev);
  };

  const handleLoad = (strategy: Strategy) => {
    loadStrategy(strategy.nodes, strategy.edges, strategy.meta.name);
    setPersistedName(strategy.meta.name);
    setLoadOpen(false);
  };

  const handleDelete = async (name: string) => {
    const ok = await showConfirm(tCommon('confirmMsg.deleteStrategy', { name }), undefined, {
      isDanger: true,
    });
    if (!ok) return;
    const newSaved = readSaved().filter((s) => s.meta.name !== name);
    writeSaved(newSaved);
    setSavedList(newSaved);
    if (name === persistedName) setPersistedName(null);
  };

  const handleNew = async () => {
    if (nodes.length > 0) {
      const ok = await showConfirm(tCommon('confirmMsg.newStrategy'), undefined, { isDanger: true });
      if (!ok) return;
    }
    clearCanvas();
    setStrategyName(t('toolbar.newStrategyDefault'));
    setPersistedName(null);
  };

  const atLimit = savedList.length >= MAX_STRATEGIES;

  return (
    <header className="h-13 flex shrink-0 items-center gap-3 border-b border-(--color-border-subtle) bg-(--color-bg-surface) px-4">
      {/* Logo */}
      <span className="mr-2 text-sm font-bold text-(--color-accent)">AlphaNodes</span>

      {/* Strategy name */}
      <input
        type="text"
        value={strategyName}
        onChange={(e) => setStrategyName(e.target.value)}
        className="max-w-xs flex-1 border-b border-transparent bg-transparent px-1 py-0.5 text-sm font-medium text-foreground transition-colors focus:border-(--color-border-default) focus:outline-none"
        placeholder={t('toolbar.strategyNamePlaceholder')}
      />

      <div className="flex-1" />

      {/* Action buttons */}
      <LanguageToggle />

      <button
        onClick={handleNew}
        className="px-3 py-1.5 text-xs font-medium rounded-md border border-(--color-border-default) text-(--color-text-secondary) hover:text-foreground hover:border-(--color-border-strong) transition-colors"
      >
        {t('toolbar.newStrategy')}
      </button>

      <div ref={dropdownRef} className="relative">
        <button
          onClick={handleOpenLoad}
          className="px-3 py-1.5 text-xs font-medium rounded-md border border-(--color-border-default) text-(--color-text-secondary) hover:text-foreground hover:border-(--color-border-strong) transition-colors"
        >
          {t('toolbar.load')}
        </button>

        {loadOpen && (
          <div className="absolute right-0 top-full mt-1 w-64 rounded-md border border-(--color-border-default) bg-(--color-bg-surface) shadow-xl z-50 overflow-hidden">
            {savedList.length === 0 ? (
              <p className="px-3 py-2.5 text-[11px] text-(--color-text-muted) text-center">
                {t('toolbar.loadDropdown.empty')}
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
                      title={t('toolbar.loadDropdown.deleteTitle')}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div
              className={`px-3 py-1.5 flex items-center justify-between border-t border-(--color-border-subtle) ${atLimit ? 'bg-(--color-danger)/10' : ''}`}
            >
              <span
                className={`text-[10px] font-medium ${atLimit ? 'text-(--color-danger)' : 'text-(--color-text-muted)'}`}
              >
                {atLimit ? t('toolbar.loadDropdown.limitReached') : t('toolbar.loadDropdown.savedStrategies')}
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
        {t('toolbar.save')}
      </button>
    </header>
  );
}
