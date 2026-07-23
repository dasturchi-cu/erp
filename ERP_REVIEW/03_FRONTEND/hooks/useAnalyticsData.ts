import { useCallback, useEffect, useState } from 'react';
import { analyticsApi, type AnalyticsQueryParams } from '@/api/services/analyticsApi';
import type { AnalyticsOverview } from '@/types';
import type { DashboardPeriod } from '@/types';

interface UseAnalyticsDataResult {
  data: AnalyticsOverview | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useAnalyticsData(
  period: DashboardPeriod = 'monthly',
  params?: Omit<AnalyticsQueryParams, 'period'>,
): UseAnalyticsDataResult {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const overview = await analyticsApi.getOverview({ period, months: 6, ...params });
      setData(overview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analitika yuklanmadi');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [period, params?.branch_id, params?.date_from, params?.date_to]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}
