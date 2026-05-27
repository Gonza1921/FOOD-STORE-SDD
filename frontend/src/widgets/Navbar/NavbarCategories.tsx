/**
 * NavbarCategories — Categories dropdown menu.
 *
 * Fetches categories from API on first click and displays them
 * as a dropdown menu. Clicking a category navigates to /catalogo?categoria_id=<id>.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosClient } from '@/shared/api/axiosClient';
import { API } from '@/shared/api/endpoints';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Category {
  id: number;
  nombre: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function NavbarCategories() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // ── Fetch categories ──
  const fetchCategories = useCallback(async () => {
    if (categories.length > 0) return; // Already cached
    setIsLoading(true);
    try {
      const response = await axiosClient.get(API.CATEGORIES.LIST);
      setCategories(response.data ?? []);
    } catch {
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [categories.length]);

  // ── Toggle dropdown ──
  const handleToggle = useCallback(() => {
    if (!isOpen) fetchCategories();
    setIsOpen((prev) => !prev);
  }, [isOpen, fetchCategories]);

  // ── Click outside ──
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Category click ──
  const handleCategoryClick = useCallback(
    (categoryId: number) => {
      setIsOpen(false);
      navigate(`/catalogo?categoria_id=${categoryId}`);
    },
    [navigate]
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
        aria-label="Categorías"
        aria-expanded={isOpen}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: '20px', fontVariationSettings: '"wght" 400' }}
        >
          category
        </span>
        <span className="hidden sm:inline">Categorías</span>
        <span
          className={`material-symbols-outlined transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          style={{ fontSize: '16px', fontVariationSettings: '"wght" 400' }}
        >
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 mt-1 w-56 bg-surface-container-lowest rounded-xl shadow-premium-lg border border-outline-variant/10 overflow-hidden z-50 animate-fade-in"
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <span className="inline-block h-5 w-5 rounded-full border-2 border-brand-600 border-t-transparent animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <p className="px-4 py-3 text-sm text-on-surface-variant">
              Sin categorías
            </p>
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.id)}
                className="w-full px-4 py-2.5 text-sm text-on-surface hover:bg-surface-container transition-colors text-left"
              >
                {cat.nombre}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
