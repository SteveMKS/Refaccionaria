import { getProductos } from "@/lib/productos";
import { ProductoCard } from "@/components/ProductoCard";

export default async function ProductosPage() {
  const productos = await getProductos();

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>
      
      {productos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay productos disponibles en este momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map(producto => (
            <ProductoCard key={producto.id} producto={producto} />
          ))}
        </div>
      )}
    </div>
  );
}
