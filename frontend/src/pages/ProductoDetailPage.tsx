import { useParams, Link } from 'react-router-dom';
import { usePublicProductoDetail } from '@/features/products';
import { useCartStore } from '@/features/cart/store';
import { Badge, Skeleton, Button } from '@/shared/ui';

export default function ProductoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const productoId = Number(id);
  const { data: product, isLoading, isError } = usePublicProductoDetail(productoId);
  const addItem = useCartStore((s) => s.addItem);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton variant="text" width="w-64" height="h-8" />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <Skeleton variant="rectangular" height="h-80" />
            <div className="space-y-4">
              <Skeleton variant="text" width="w-full" height="h-6" />
              <Skeleton variant="text" width="w-3/4" />
              <Skeleton variant="text" width="w-1/3" height="h-10" />
              <Skeleton variant="text" width="w-full" height="h-20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-error-container mx-auto mb-5">
            <span className="material-symbols-outlined text-error" style={{ fontSize: '36px', fontVariationSettings: '"wght" 500' }}>
              search_off
            </span>
          </div>
          <h1 className="text-2xl font-bold text-on-surface mb-2">Producto no encontrado</h1>
          <p className="text-sm text-on-surface-variant mb-6">
            El producto que buscas no existe o ha sido eliminado
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"wght" 400' }}>
              arrow_back
            </span>
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      productoId: product.id,
      nombre: product.nombre,
      precio: Number(product.precio_base),
    });
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
          <Link to="/catalogo" className="hover:text-brand-600 transition-colors">
            Catálogo
          </Link>
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"wght" 300' }}>
            chevron_right
          </span>
          <span className="text-on-surface font-medium truncate max-w-[200px]">
            {product.nombre}
          </span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image placeholder */}
          <div className="h-80 rounded-2xl bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-outline-variant/50" style={{ fontSize: '80px', fontVariationSettings: '"wght" 200' }}>
              image
            </span>
          </div>

          {/* Product info */}
          <div>
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-2xl font-bold text-on-surface">{product.nombre}</h1>
              <Badge variant={product.disponible ? 'success' : 'neutral'} dot>
                {product.disponible ? 'Disponible' : 'No disponible'}
              </Badge>
            </div>

            {product.descripcion && (
              <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
                {product.descripcion}
              </p>
            )}

            <div className="mt-6">
              <span className="text-3xl font-bold text-brand-600">
                ${Number(product.precio_base).toFixed(2)}
              </span>
            </div>

            {/* Categories */}
            {product.categorias.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                  Categorías
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.categorias.map((cat) => (
                    <Badge key={cat.id} variant="info" size="sm">
                      {cat.nombre}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Ingredientes */}
            {product.ingredientes.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">
                  Ingredientes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.ingredientes.map((ing) => (
                    <span
                      key={ing.id}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        ing.es_alergeno
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-outline-variant/30 bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      {ing.es_alergeno && (
                        <span
                          className="material-symbols-outlined text-xs"
                          style={{ fontSize: '14px', fontVariationSettings: '"wght" 500' }}
                        >
                          warning
                        </span>
                      )}
                      {ing.nombre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Add to cart */}
            {product.disponible && (
              <div className="mt-8">
                <Button
                  variant="premium"
                  size="lg"
                  icon="add_shopping_cart"
                  onClick={handleAddToCart}
                  className="w-full sm:w-auto"
                >
                  Agregar al carrito
                </Button>
              </div>
            )}

            <div className="mt-4">
              <Link
                to="/catalogo"
                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"wght" 400' }}>
                  arrow_back
                </span>
                Volver al catálogo
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
