import type { Trade } from "@/types/backtest";

export const closedWinTrade: Trade = {
  id: "trade_win_1",
  direction: "LONG",
  entryTimestamp: new Date("2023-01-10").getTime(),
  exitTimestamp: new Date("2023-01-20").getTime(),
  entryPrice: 100,
  exitPrice: 110,
  positionSizePct: 100,
  shares: 100,
  entryCapital: 10_000,
  pnl: 1_000,
  pnlPct: 10,
  status: "CLOSED",
  exitReason: "SIGNAL",
  highWatermark: 110,
  entryBarIndex: 0,
};

export const closedLossTrade: Trade = {
  ...closedWinTrade,
  id: "trade_loss_1",
  exitPrice: 90,
  pnl: -1_000,
  pnlPct: -10,
  exitReason: "STOP_LOSS",
  highWatermark: 100,
};

export const openTrade: Trade = {
  ...closedWinTrade,
  id: "trade_open_1",
  status: "OPEN",
  exitPrice: undefined,
  exitTimestamp: undefined,
  pnl: undefined,
  pnlPct: undefined,
  exitReason: undefined,
};
