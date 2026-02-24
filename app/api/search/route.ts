import { NextRequest, NextResponse } from "next/server";
import { yf } from "@/lib/data/fetchers";
import type { AssetSearchResult } from "@/types/api";

const ASSET_CLASS_QUOTE_TYPES: Record<string, string[]> = {
  STOCK: ["EQUITY"],
  CRYPTO: ["CRYPTOCURRENCY"],
};

/**
 * Yahoo Finance crypto symbols use BASE-QUOTE format (e.g. SOL-USD, ETH-BTC).
 * Binance requires BASEQUOTE format where USD → USDT (e.g. SOLUSDT, ETHBTC).
 */
function toBinanceSymbol(yahooSymbol: string): string {
  const [base, quote] = yahooSymbol.split("-");
  if (!base || !quote) return yahooSymbol.toUpperCase();
  const binanceQuote = quote.toUpperCase() === "USD" ? "USDT" : quote.toUpperCase();
  return (base + binanceQuote).toUpperCase();
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const assetClass = req.nextUrl.searchParams.get("assetClass") ?? "STOCK";

  if (q.trim().length < 1) {
    return NextResponse.json({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = (await yf.search(q, { newsCount: 0 })) as any;
    const allowedTypes = ASSET_CLASS_QUOTE_TYPES[assetClass] ?? ["EQUITY"];

    const filtered: AssetSearchResult[] = ((result.quotes ?? []) as unknown[])
      .filter((item) => {
        const qt = (item as { quoteType?: string }).quoteType ?? "";
        return allowedTypes.includes(qt.toUpperCase());
      })
      .slice(0, 8)
      .map((item) => {
        const i = item as {
          symbol?: string;
          longname?: string;
          shortname?: string;
          exchDisp?: string;
          typeDisp?: string;
        };
        const rawSymbol = i.symbol ?? "";
        const symbol =
          assetClass === "CRYPTO" ? toBinanceSymbol(rawSymbol) : rawSymbol;
        return {
          symbol,
          name: i.longname ?? i.shortname ?? rawSymbol,
          exchDisp: i.exchDisp ?? "",
          typeDisp: i.typeDisp ?? "",
        };
      })
      .filter((r) => r.symbol !== "");

    return NextResponse.json({
      success: true,
      data: filtered,
      timestamp: new Date().toISOString(),
    });
  } catch {
    // Silently return empty — autocomplete should not break the UI
    return NextResponse.json({
      success: true,
      data: [],
      timestamp: new Date().toISOString(),
    });
  }
}
