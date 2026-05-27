/**
 * NavbarSearch — Search input with debounce and product suggestions dropdown.
 *
 * - Fetches product suggestions after 300ms debounce
 * - On Enter: navigates to /catalogo?search=<query>
 * - On click suggestion: navigates to /productos/<id>
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductSuggestion {
  id: number;
  nombre: string;
  precio_base: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NavbarSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Debounced search ──
  const fetchSuggestions = useCallback(async (search: string) => {
    if (search.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axiosClient.get(API.PRODUCTS.PUBLIC_CATALOG, {
        params: { search, limit: 8 },
      });
      const data = response.data as { items?: ProductSuggestion[] };
      const items = data.items ?? [];
      setSuggestions(items);
      setIsOpen(items.length > 0);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
    },
    [fetchSuggestions]
  );

  // ── Key handlers ──
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && query.trim()) {
        setIsOpen(false);
        navigate(`/catalogo?search=${encodeURIComponent(query.trim())}`);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    },
    [query, navigate]
  );

  // ── Click outside ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative flex-1 max-w-md mx-4">
      {/* Search input */}
      <div className="relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          placeholder="Buscar productos..."
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-surface-container text-sm text-on-surface placeholder:text-on-surface-variant/60 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-brand-600/20 focus:border-brand-600 transition-all"
          aria-label="Buscar productos"
          autoComplete="off"
        />
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <span className="inline-block h-4 w-4 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
          </span>
        )}
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-surface-container-lowest rounded-xl shadow-premium-lg border border-outline-variant/10 overflow-hidden z-50 animate-fade-in"
        >
          {suggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => {
                setIsOpen(false);
                setQuery('');
                navigate(`/productos/${product.id}`);
              }}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
            >
              <span className="font-medium">{product.nombre}</span>
              <span className="text-on-surface-variant text-xs">
                ${parseFloat(product.precio_base).toFixed(2)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
