import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// cache 모듈은 모듈-스코프 Map을 사용하므로 테스트 간 격리를 위해
// vi.resetModules()로 매 테스트마다 새 모듈 인스턴스를 가져온다.
describe("cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function getModule() {
    const mod = await import("@/lib/data/cache");
    return mod;
  }

  // ── getCached / setCached ──────────────────────────────────────────────

  it("미존재 키 → null 반환", async () => {
    const { getCached } = await getModule();
    expect(getCached("nonexistent")).toBeNull();
  });

  it("setCached 직후 getCached → 동일 데이터 반환", async () => {
    const { getCached, setCached } = await getModule();
    const data = [1, 2, 3];
    setCached("key1", data);
    expect(getCached("key1")).toEqual(data);
  });

  it("30분 + 1ms 경과 후 getCached → null (만료)", async () => {
    const { getCached, setCached } = await getModule();
    setCached("key2", "value");
    vi.advanceTimersByTime(30 * 60 * 1000 + 1);
    expect(getCached("key2")).toBeNull();
  });

  it("29분 59초 경과 후 getCached → 여전히 유효", async () => {
    const { getCached, setCached } = await getModule();
    setCached("key3", "value");
    vi.advanceTimersByTime(30 * 60 * 1000 - 1);
    expect(getCached("key3")).toBe("value");
  });

  it("만료된 항목은 getCached 호출 시 내부 store에서 삭제됨", async () => {
    const { getCached, setCached } = await getModule();
    setCached("key4", "to-be-deleted");
    vi.advanceTimersByTime(30 * 60 * 1000 + 1);
    // 첫 번째 호출 → null + 삭제
    expect(getCached("key4")).toBeNull();
    // 두 번째 호출도 null (삭제 확인)
    expect(getCached("key4")).toBeNull();
  });

  it("동일 키에 setCached 두 번 → 최신 값으로 갱신", async () => {
    const { getCached, setCached } = await getModule();
    setCached("key5", "first");
    setCached("key5", "second");
    expect(getCached("key5")).toBe("second");
  });

  it("다른 타입 저장 후 동일 타입으로 조회 가능", async () => {
    const { getCached, setCached } = await getModule();
    const bars = [{ timestamp: 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 }];
    setCached<typeof bars>("bars-key", bars);
    const result = getCached<typeof bars>("bars-key");
    expect(result).toEqual(bars);
    expect(result![0].close).toBe(1.5);
  });

  // ── makeCacheKey ───────────────────────────────────────────────────────

  it('makeCacheKey → "symbol:timeframe:fromDay:toDay" 형식 반환', async () => {
    const { makeCacheKey } = await getModule();
    const key = makeCacheKey("AAPL", "1d", 86_400_000, 2 * 86_400_000);
    expect(key).toBe("AAPL:1d:1:2");
  });

  it("같은 날 다른 ms → 동일 캐시 키 (일 단위 내림)", async () => {
    const { makeCacheKey } = await getModule();
    const key1 = makeCacheKey("AAPL", "1d", 86_400_000, 2 * 86_400_000);
    // 같은 날 오후 시간대 (millisecond 더해도 같은 day)
    const key2 = makeCacheKey("AAPL", "1d", 86_400_000 + 3600_000, 2 * 86_400_000 + 3600_000);
    expect(key1).toBe(key2);
  });

  it("서로 다른 날 → 다른 캐시 키", async () => {
    const { makeCacheKey } = await getModule();
    const key1 = makeCacheKey("AAPL", "1d", 86_400_000, 2 * 86_400_000);
    const key2 = makeCacheKey("AAPL", "1d", 2 * 86_400_000, 3 * 86_400_000);
    expect(key1).not.toBe(key2);
  });
});
