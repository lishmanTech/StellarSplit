const mockRedisStore = new Map<string, string>();
let mockLatestMetric: PlatformMetrics | null = null;

jest.mock('ioredis', () =>
  jest.fn().mockImplementation(() => ({
    set: jest.fn(async (key: string, value: string) => {
      mockRedisStore.set(key, value);
      return 'OK';
    }),
    get: jest.fn(async (key: string) => mockRedisStore.get(key) ?? null),
  })),
);

jest.mock('@apla/clickhouse', () =>
  jest.fn().mockImplementation(() => ({
    insert: jest.fn(async (_table: string, metric: PlatformMetrics) => {
      mockLatestMetric = metric;
      return undefined;
    }),
    query: jest.fn(async () => (mockLatestMetric ? [mockLatestMetric] : [])),
  })),
);

// Tests for analytics engine
import { cacheMetrics, getCachedMetrics } from './analytics.cache';
import { aggregateMetrics, getAggregatedMetrics } from './analytics.aggregate';
import { PlatformMetrics } from './analytics.metrics';

describe('Analytics Engine', () => {
  const sampleMetric: PlatformMetrics = {
    splitsPerSecond: 10,
    activeUsers: 100,
    paymentSuccessRate: 0.98,
    averageSettlementTime: 2.5,
    geographicDistribution: { US: 50, UK: 30, IN: 20 },
  };

  beforeEach(() => {
    mockRedisStore.clear();
    mockLatestMetric = null;
  });

  it('should cache metrics in Redis', async () => {
    await cacheMetrics(sampleMetric);
    const cached = await getCachedMetrics();
    expect(cached).toEqual(sampleMetric);
  });

  it('should aggregate metrics in ClickHouse', async () => {
    await aggregateMetrics(sampleMetric);
    const aggregated = await getAggregatedMetrics();
    expect(aggregated).toMatchObject(sampleMetric);
  });
});
