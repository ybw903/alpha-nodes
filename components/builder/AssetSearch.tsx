'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AssetSearchResult } from '@/types/api';

interface AssetSearchProps {
  assetClass: string;
  value: string;
  onChange: (symbol: string, name: string) => void;
  placeholder?: string;
}

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function AssetSearch({ assetClass, value, onChange, placeholder }: AssetSearchProps) {
  const [inputValue, setInputValue] = useState(value);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(inputValue, 300);

  // Sync external value changes (e.g. assetClass reset)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const { data: results = [], isFetching, isSuccess } = useQuery<AssetSearchResult[]>({
    queryKey: ['assetSearch', debouncedQuery, assetClass],
    queryFn: async () => {
      if (debouncedQuery.trim().length < 1) return [];
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}&assetClass=${assetClass}`,
      );
      const json = await res.json();
      return json.success ? (json.data as AssetSearchResult[]) : [];
    },
    enabled: debouncedQuery.trim().length >= 1,
    staleTime: 60_000,
  });

  // Close dropdown on outside mousedown (before blur fires)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = useCallback(
    (item: AssetSearchResult) => {
      setInputValue(item.symbol);
      onChange(item.symbol, item.name);
      setOpen(false);
    },
    [onChange],
  );

  const hasQuery = open && debouncedQuery.trim().length >= 1;
  // 디바운스 대기 중(inputValue ≠ debouncedQuery)이거나 실제 fetching 중일 때 로딩 표시
  const isLoading = hasQuery && (inputValue.trim() !== debouncedQuery.trim() || isFetching);
  const showResults = hasQuery && !isLoading && results.length > 0;
  const showEmpty = hasQuery && !isLoading && isSuccess && results.length === 0;
  const showDropdown = isLoading || showResults || showEmpty;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? '심볼 또는 종목명 검색'}
          className="w-full bg-(--color-bg-elevated) border border-(--color-border-default) rounded-md px-2 py-1.5 pr-6 text-xs text-foreground focus:outline-none focus:border-(--color-accent) transition-colors font-mono"
        />
        {isLoading && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 border border-t-transparent border-(--color-accent) rounded-full animate-spin" />
        )}
      </div>

      {showDropdown && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-(--color-border-default) bg-(--color-bg-surface) shadow-xl overflow-hidden">
          {isLoading ? (
            <li className="px-3 py-2.5 text-[11px] text-(--color-text-muted) text-center">
              검색 중...
            </li>
          ) : showResults ? (
            results.map((item) => (
              <li key={item.symbol}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(item)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-(--color-bg-elevated) transition-colors"
                >
                  <span className="text-xs font-mono font-semibold text-foreground min-w-15">
                    {item.symbol}
                  </span>
                  <span className="text-[11px] text-(--color-text-muted) truncate flex-1">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-(--color-text-muted) shrink-0">
                    {item.exchDisp}
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2.5 text-[11px] text-(--color-text-muted) text-center">
              검색 결과가 없습니다
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
