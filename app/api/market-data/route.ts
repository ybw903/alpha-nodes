import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { fetchMarketData } from '@/lib/data/fetchers';
import type { AssetClass, Timeframe } from '@/types/strategy';

const querySchema = z.object({
  symbol: z.string().min(1),
  assetClass: z.enum(['US_STOCK', 'KR_STOCK', 'CRYPTO']),
  timeframe: z.enum(['1d', '1w', '1m']),
  from: z.coerce.number().int().positive(),
  to: z.coerce.number().int().positive(),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(params);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: '잘못된 요청 파라미터입니다.', code: 'INVALID_PARAMS', timestamp: new Date().toISOString() },
      { status: 400 },
    );
  }

  const { symbol, assetClass, timeframe, from, to } = parsed.data;

  try {
    const bars = await fetchMarketData({
      symbol,
      assetClass: assetClass as AssetClass,
      timeframe: timeframe as Timeframe,
      from,
      to,
    });

    return NextResponse.json({
      success: true,
      data: { symbol, timeframe, bars },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : '데이터 수신 실패';
    return NextResponse.json(
      { success: false, error: message, code: 'FETCH_ERROR', timestamp: new Date().toISOString() },
      { status: 502 },
    );
  }
}
