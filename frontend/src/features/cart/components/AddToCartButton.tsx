import { useCartStore } from '../store';

export interface AddToCartButtonProps {
  productoId: number;
  nombre: string;
  precio: number;
  imagen?: string;
}

export function AddToCartButton({ productoId, nombre, precio, imagen }: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ productoId, nombre, precio, imagen: imagen ?? '' });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full mt-3 px-3 py-2 text-xs font-semibold rounded-lg
                 bg-brand-600 text-white hover:bg-brand-700 
                 active:scale-[0.98] transition-all duration-200
                 flex items-center justify-center gap-1.5"
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: '16px', fontVariationSettings: '"wght" 500' }}
      >
        add_shopping_cart
      </span>
      Agregar al carrito
    </button>
  );
}

export default AddToCartButton;