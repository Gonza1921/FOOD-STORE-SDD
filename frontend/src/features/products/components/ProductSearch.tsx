/**
 * ProductSearch — Debounced Search input with Material Symbols search icon.
 * Stitch-inspired design: rounded-xl, elevated on focus.
 */

import { useState, useEffect, useRef } from 'react';

export interface ProductSearchProps {
  /** Current search value */
  value: string;
  /** Callback when search term changes (debounced) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
}

export function ProductSearch({
  value,
  onChange,
  placeholder = 'Buscar productos, SKU o categoría...',
  disabled = false,
}: ProductSearchProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 350);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
      </div>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className="block w-full pl-10 pr-3 py-3 bg-surface-container-lowest border border-outline-variant/30 rounded-xl
                   focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 focus:outline-none
                   font-sans text-[16px] leading-[24px] placeholder:text-on-surface-variant/60
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-all duration-200"
      />
    </div>
  );
}

export default ProductSearch;
