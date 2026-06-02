import { Link } from 'react-router-dom';

export interface BreadcrumbSegment {
  label: string;
  slug?: string;
}

interface BreadcrumbNavProps {
  segments: BreadcrumbSegment[];
}

export default function BreadcrumbNav({ segments }: BreadcrumbNavProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-on-surface-variant">
        {/* Home */}
        <li>
          <Link
            to="/"
            className="transition-colors hover:text-brand-600"
          >
            Inicio
          </Link>
        </li>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li key={`${segment.slug ?? index}-${index}`} className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base text-outline-variant">
                chevron_right
              </span>
              {isLast || !segment.slug ? (
                <span
                  className={
                    isLast
                      ? 'font-medium text-on-surface'
                      : 'text-on-surface-variant'
                  }
                >
                  {segment.label}
                </span>
              ) : (
                <Link
                  to={`/categorias/${segment.slug}`}
                  className="transition-colors hover:text-brand-600"
                >
                  {segment.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
