import { create } from 'zustand';
import type { BacktestResult } from '@/types/backtest';

interface BacktestState {
  result: BacktestResult | null;
  isRunning: boolean;
  error: string | null;
  lastRunStrategyId: string | null;

  setResult: (result: BacktestResult) => void;
  setIsRunning: (running: boolean) => void;
  setError: (error: string | null) => void;
  clearResult: () => void;
}

export const useBacktestStore = create<BacktestState>((set) => ({
  result: null,
  isRunning: false,
  error: null,
  lastRunStrategyId: null,

  setResult: (result) =>
    set({ result, lastRunStrategyId: result.strategyId, error: null }),

  setIsRunning: (isRunning) => set({ isRunning }),
  setError: (error) => set({ error, isRunning: false }),
  clearResult: () => set({ result: null, error: null }),
}));
