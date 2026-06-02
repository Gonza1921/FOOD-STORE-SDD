import { useState } from 'react';
import { useDashboardPeriod, type Period } from '../hooks/useDashboardPeriod';

const OPTIONS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: 'custom', label: 'Personalizado' },
];

export function DateRangeFilter() {
  const { period, setPeriod, customRange, setCustomRange } = useDashboardPeriod();
  const [localStart, setLocalStart] = useState(customRange?.start || '');
  const [localEnd, setLocalEnd] = useState(customRange?.end || '');

  const handleApplyCustom = () => {
    if (localStart && localEnd) {
      setCustomRange({ start: localStart, end: localEnd });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex rounded-lg border border-outline-variant/30 overflow-hidden">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPeriod(opt.value)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              period === opt.value
                ? 'bg-brand-600 text-white'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="rounded-lg border border-outline-variant/30 bg-surface-container px-2.5 py-1.5 text-sm text-on-surface"
          />
          <span className="text-sm text-on-surface-variant">—</span>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="rounded-lg border border-outline-variant/30 bg-surface-container px-2.5 py-1.5 text-sm text-on-surface"
          />
          <button
            type="button"
            onClick={handleApplyCustom}
            disabled={!localStart || !localEnd}
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            Aplicar
          </button>
        </div>
      )}
    </div>
  );
}
