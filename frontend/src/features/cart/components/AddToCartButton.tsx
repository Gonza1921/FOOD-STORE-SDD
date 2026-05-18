import { useState, useCallback } from 'react';
import { useCartStore } from '../store';
import { useUiStore } from '@/features/ui/store';

export interface AddToCartButtonProps {
  productoId: number;
  nombre: string;
  precio: number;
  imagen?: string;
}

export function AddToCartButton({ productoId, nombre, precio, imagen }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const addToast = useUiStore((s) => s.addToast);
  const [justAdded, setJustAdded] = useState(false);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (justAdded) return;

      addItem({ productoId, nombre, precio, precioCarrito: precio, imagen: imagen ?? '' });
      addToast({ message: `${nombre} agregado al carrito`, type: 'success' });

      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    },
    [addItem, addToast, justAdded, productoId, nombre, precio, imagen],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={justAdded}
      className={`w-full mt-3 px-3 py-2 text-xs font-semibold rounded-lg
                  transition-all duration-200 flex items-center justify-center gap-1.5
                  ${
                    justAdded
                      ? 'bg-success text-white scale-[0.98]'
                      : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98]'
                  }`}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '16px', fontVariationSettings: '"wght" 500' }}
      >
        {justAdded ? 'check_circle' : 'add_shopping_cart'}
      </span>
      {justAdded ? 'Agregado' : 'Agregar al carrito'}
    </button>
  );
}

export default AddToCartButton;