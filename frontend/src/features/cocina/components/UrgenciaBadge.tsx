import type { UrgencyLevel } from '../types';

interface UrgenciaBadgeProps {
  seconds: number;
  urgencyLevel: UrgencyLevel;
}

const minutes = (s: number) => Math.floor(s / 60);

export function UrgenciaBadge({ seconds, urgencyLevel }: UrgenciaBadgeProps) {
  const min = minutes(seconds);

  if (urgencyLevel === 'normal') {
    return (
      <span className="text-sm text-on-surface-variant font-medium">
        {min} min
      </span>
    );
  }

  if (urgencyLevel === 'warning') {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg border border-warning px-2 py-0.5 text-sm font-semibold text-warning">
        <span>⚠️</span>
        <span>{min} min</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-error px-2 py-0.5 text-sm font-bold text-white animate-pulse-soft">
      <span>🚨</span>
      <span>{min}+ min</span>
    </span>
  );
}
