import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Producto {
  id_sku: string;
  nombre: string;
  precio: number;
  imagen_principal: string;
  descripcion: string;
  existencias: number;
  slug: string;
  marcas: { nombre: string } | { nombre: string }[] | null;
  subcategoria_nivel2: {
    nombre: string;
  } | null;
}

export default async function ProductosPage() {
  const { data: productos, error } = await supabase
    .from('productos')
    .select(`
      id_sku,
      nombre,
      precio,
      imagen_principal,
      descripcion,
      existencias,
      slug,
      marcas(nombre),
      subcategoria_nivel2(nombre)
    `)
    .eq('activo', true)
    .order('fecha_creacion', { ascending: false });

  if (error) {
    console.error('Error al cargar productos:', error);
    return <div>Error al cargar los productos</div>;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Catálogo de Productos</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((producto) => (
          <Card key={producto.id_sku} className="hover:shadow-lg transition-shadow h-full flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{producto.nombre}</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-grow space-y-3">
              {/* Imagen del producto */}
              <div className="relative mx-auto w-40 h-40 bg-gray-100 rounded-md mb-3">
                <Image
                  src={producto.imagen_principal || '/placeholder-product.jpg'}
                  alt={producto.nombre}
                  fill
                  className="object-contain p-3"
                  priority
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              
              {/* Información del producto */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Marca:</span>
                  <span>
                    {Array.isArray(producto.marcas)
                      ? producto.marcas[0]?.nombre || 'Sin marca'
                      : producto.marcas?.nombre || 'Sin marca'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Categoría:</span>
                  <span>{producto.subcategoria_nivel2?.nombre || 'Sin categoría'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">SKU:</span>
                  <span className="font-mono">#{producto.id_sku}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="font-medium text-gray-600">Disponibilidad:</span>
                  <span>{producto.existencias > 0 ? `${producto.existencias} unidades` : 'Agotado'}</span>
                </div>
              </div>
              
              {/* Descripción */}
              <p className="text-xs text-gray-500 line-clamp-2 mt-2">
                {producto.descripcion || 'Descripción no disponible'}
              </p>
              
              {/* Precio y botón de carrito */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t">
                <span className="text-lg font-bold text-blue-600">
                  ${producto.precio.toLocaleString('es-MX')}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    producto.existencias > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {producto.existencias > 0 ? 'Disponible' : 'Agotado'}
                  </span>
                  <button 
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    aria-label="Agregar al carrito"
                    disabled={producto.existencias <= 0}
                  >
                    <ShoppingCart className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
