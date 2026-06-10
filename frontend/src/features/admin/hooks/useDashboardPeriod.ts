import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export type Period = 'today' | '7d' | '30d' | 'custom';

export interface CustomRange {
  start: string;
  end: string;
}

export function useDashboardPeriod() {
  const [searchParams, setSearchParams] = useSearchParams();

  const period = useMemo<Period>(() => {
    const p = searchParams.get('periodo');
    if (p === 'today' || p === '7d' || p === '30d' || p === 'custom') {
      return p;
    }
    return '30d';
  }, [searchParams]);

  const customRange = useMemo<CustomRange | null>(() => {
    if (period !== 'custom') return null;
    const start = searchParams.get('desde');
    const end = searchParams.get('hasta');
    if (start && end) return { start, end };
    return null;
  }, [period, searchParams]);

  const setPeriod = useCallback(
    (p: Period) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (p === '30d') {
          next.delete('periodo');
        } else {
          next.set('periodo', p);
        }
        if (p !== 'custom') {
          next.delete('desde');
          next.delete('hasta');
        }
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const setCustomRange = useCallback(
    (range: CustomRange) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('periodo', 'custom');
        next.set('desde', range.start);
        next.set('hasta', range.end);
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  return { period, setPeriod, customRange, setCustomRange };
}
