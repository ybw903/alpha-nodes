import { NextResponse } from 'next/server';
import { runBacktest } from '@/lib/backtest/engine';
import type { BacktestRequest } from '@/types/backtest';
import type { ApiResponse } from '@/types/api';
import type { BacktestResult } from '@/types/backtest';

export async function POST(request: Request) {
  const timestamp = new Date().toISOString();

  try {
    const body = await request.json() as BacktestRequest;

    if (!body.strategy?.nodes || !body.strategy?.edges) {
      const errorRes: ApiResponse<never> = {
        success: false,
        error: '유효하지 않은 전략 데이터입니다.',
        code: 'INVALID_STRATEGY',
        timestamp,
      };
      return NextResponse.json(errorRes, { status: 400 });
    }

    if (!body.from || !body.to || body.from >= body.to) {
      const errorRes: ApiResponse<never> = {
        success: false,
        error: '유효하지 않은 날짜 범위입니다.',
        code: 'INVALID_DATE_RANGE',
        timestamp,
      };
      return NextResponse.json(errorRes, { status: 400 });
    }

    const result = await runBacktest(body);

    const successRes: ApiResponse<BacktestResult> = {
      success: true,
      data: result,
      timestamp,
    };
    return NextResponse.json(successRes);
  } catch (err) {
    const message = err instanceof Error ? err.message : '백테스트 실행 중 오류가 발생했습니다.';
    const errorRes: ApiResponse<never> = {
      success: false,
      error: message,
      code: 'BACKTEST_ERROR',
      timestamp,
    };
    return NextResponse.json(errorRes, { status: 500 });
  }
}
