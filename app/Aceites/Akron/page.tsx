import { notFound } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { Producto } from "@/types/productos";
import { ProductInfoRow } from "@/components/ProductInfoRow";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const { data, error } = await supabase
    .from("productos")
    .select(`
      nombre,
      numero_parte,
      id_sku,
      descripcion,
      precio,
      existencias,
      imagen_url,
      marcas(nombre),
      subcategoria_nivel3(nombre)
    `)
    .eq("numero_parte", params.id)
    .single();

  if (error || !data) return notFound();

  const producto: Producto = data;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección de imagen */}
        <div className="bg-white p-6 rounded-lg shadow-md flex justify-center">
          <div className="relative w-full max-w-lg aspect-square">
            <Image
              src={producto.imagen_url || "/placeholder-product.jpg"}
              alt={producto.nombre}
              fill
              className="object-contain rounded-md"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Sección de información */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">{producto.nombre}</h1>
          
          <div className="space-y-2">
            <ProductInfoRow label="No. de Parte" value={producto.numero_parte} />
            <ProductInfoRow label="SKU" value={`#${producto.id_sku}`} />
            <ProductInfoRow label="Marca" value={producto.marcas?.nombre} />
            <ProductInfoRow label="Categoría" value={producto.subcategoria_nivel3?.nombre} />
          </div>

          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <p className="font-semibold text-blue-800">Verifica si le queda a tu vehículo</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold text-gray-900">
              {new Intl.NumberFormat('es-MX', { 
                style: 'currency', 
                currency: 'MXN' 
              }).format(producto.precio)}
            </span>
            <span className={`px-2 py-1 rounded text-sm ${
              producto.existencias > 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {producto.existencias > 0 ? 'Disponible' : 'Agotado'}
            </span>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-semibold text-lg mb-2">Descripción</h2>
            <p className="text-gray-700">
              {producto.descripcion || "Descripción no disponible"}
            </p>
          </div>

          <div className="space-y-4">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
              disabled={producto.existencias <= 0}
            >
              {producto.existencias > 0 ? 'AGREGAR AL CARRITO' : 'PRODUCTO AGOTADO'}
            </Button>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Entrega y disponibilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Compra en línea y recoge en tienda</p>
                <p className="text-sm text-gray-600">Disponible | Centro Pio Pico Tijuana Baja California</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Ofertas Disponibles</h2>
      </div>
    </div>
  );
}
