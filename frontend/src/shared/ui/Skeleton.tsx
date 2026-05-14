// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SkeletonProps {
  /** Shape variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  /** Width (any Tailwind width class, e.g. 'w-full', 'w-24') */
  width?: string;
  /** Height (any Tailwind height class, e.g. 'h-4', 'h-48') */
  height?: string;
  /** Rounded class override */
  rounded?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Default styles by variant
// ---------------------------------------------------------------------------

const variantDefaults: Record<
  string,
  { width: string; height: string; rounded: string }
> = {
  text: { width: 'w-full', height: 'h-4', rounded: 'rounded-md' },
  circular: { width: 'w-10', height: 'h-10', rounded: 'rounded-full' },
  rectangular: { width: 'w-full', height: 'h-32', rounded: 'rounded-xl' },
  card: { width: 'w-full', height: 'h-40', rounded: 'rounded-xl' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Skeleton({
  variant = 'text',
  width,
  height,
  rounded,
  className = '',
}: SkeletonProps) {
  const defaults = variantDefaults[variant];

  return (
    <div
      role="status"
      aria-label="Cargando..."
      className={`
        shimmer animate-pulse-soft
        bg-surface-container-high
        ${width || defaults.width}
        ${height || defaults.height}
        ${rounded || defaults.rounded}
        ${className}
      `.trim()}
    />
  );
}
