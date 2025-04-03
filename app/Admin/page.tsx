import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

// Datos de ejemplo para el producto
const productoEjemplo = {
  id: "15D933",
  nombre: "Aceite de Motor Sintético Castrol 5W-40 1 Cuarto",
  numero_parte: "15D933",
  sku: "539624",
  precio: 449.00,
  descripcion: "Aceite sintético de alto rendimiento para motores modernos",
  disponible: true,
  ubicacion: "Ruta Mariano Matamoros, Frente a la PGJE",
  imagen_url: "/Castrol.jpg" // Asegúrate de tener esta imagen en tu carpeta public
};

export default function ProductPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sección de imagen */}
        <div className="bg-white p-6 rounded-lg shadow-md flex justify-center">
          <div className="relative w-full max-w-lg aspect-square">
            <Image
              src={productoEjemplo.imagen_url}
              alt={productoEjemplo.nombre}
              fill
              className="object-contain rounded-md"
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>
        </div>

        {/* Sección de información */}
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">{productoEjemplo.nombre}</h1>
          
          <div className="space-y-2">
            <p className="text-gray-600">
              <span className="font-semibold">No. de Parte:</span> {productoEjemplo.numero_parte}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">SKU:</span> #{productoEjemplo.sku}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-3xl font-bold">
              ${productoEjemplo.precio.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
            <span className={`px-2 py-1 rounded text-sm ${
              productoEjemplo.disponible 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {productoEjemplo.disponible ? 'Disponible' : 'Agotado'}
            </span>
          </div>

          <div className="space-y-4">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg">
              Agregar al carrito
            </Button>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Entrega y disponibilidad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Compra en línea y recoge en tienda</p>
                <p className="text-sm text-gray-600">
                  {productoEjemplo.disponible ? 'Disponible' : 'No disponible'} | {productoEjemplo.ubicacion}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sección de ofertas */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Ofertas Disponibles</h2>
        {/* Aquí puedes agregar productos relacionados como ofertas */}
      </div>
    </div>
  );
}