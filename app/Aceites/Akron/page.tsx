import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import Image from "next/image";

export default async function ProductPage({ params }: { params: { id: string } }) {
  // Obtener datos del producto desde Supabase
  const { data: producto } = await supabase
    .from("productos")
    .select(
      `
      nombre,
      numero_parte,
      id_sku,
      descripcion,
      precio,
      existencias,
      imagen_url,
      marcas(nombre),
      subcategoria_nivel3(nombre)
    `
    )
    .eq("numero_parte", params.id)
    .single();

  if (!producto) return <div>Producto no encontrado</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección de imagen */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="aspect-square relative">
            <Image
              src={producto.imagen_url || "/placeholder-product.jpg"}
              alt={producto.nombre}
              width={600}
              height={600}
              className="w-full h-full object-contain rounded-md"
              priority={true}
            />
          </div>
        </div>

        {/* Sección de información */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{producto.nombre}</h1>

          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-semibold">No. de Parte:</span> {producto.numero_parte}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">SKU:</span> #{producto.id_sku}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Marca:</span> {producto.marcas?.nombre}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Categoría:</span> {producto.subcategoria_nivel3?.nombre}
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <p className="font-semibold text-blue-800">Verifica si le queda a tu vehículo</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold">${producto.precio.toLocaleString()}</span>
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Disponible</span>
          </div>

          <div className="border-t pt-4">
            <h2 className="font-semibold text-lg mb-2">Descripción</h2>
            <p className="text-gray-700">{producto.descripcion || "Descripción no disponible"}</p>
          </div>

          <div className="space-y-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">
              AGREGAR AL CARRITO
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

      {/* Sección de ofertas */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Ofertas Disponibles</h2>
      </div>
    </div>
  );
}
