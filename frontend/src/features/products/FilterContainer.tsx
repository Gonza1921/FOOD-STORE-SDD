import React, { useState } from 'react';
import { PriceRangeFilter } from './PriceRangeFilter';
import { SortDropdown } from './SortDropdown';
import { ClearFiltersButton } from './ClearFiltersButton';

/**
 * FilterContainer — Responsive layout for all filter components
 *
 * Features:
 * - Desktop: vertical sidebar
 * - Mobile: collapsible accordion
 * - Responsive with Tailwind
 */
export function FilterContainer(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          aria-expanded={isOpen}
          aria-label="Toggle filtros"
        >
          {isOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
      </div>

      {/* Filter Container: Mobile Accordion / Desktop Sidebar */}
      <aside
        className={`${
          isOpen ? 'block' : 'hidden'
        } md:block md:w-64 md:sticky md:top-4 md:max-h-screen md:overflow-y-auto`}
      >
        <div className="flex flex-col gap-4">
          {/* Price Range Filter */}
          <PriceRangeFilter />

          {/* Sort Dropdown */}
          <SortDropdown />

          {/* Clear Filters Button */}
          <ClearFiltersButton />
        </div>
      </aside>
    </>
  );
}
